export function createBoardColumnActions(deps) {
  const {
    canEditBoardStructure,
    canEditDeals,
    selectedTaskIds,
    usingDemoMode,
    supabase,
    loadData,
    setErrorText,
    setCustomColumns,
    setTaskMeta,
    setSelectedTask,
    setPendingColumnDeleteId,
    selectedBoardId,
    customColumns,
    allColumns,
    columnWidths,
    setColumnWidths,
    setHiddenColumnIds,
    setColumnOrder,
    patchTaskMeta,
    logTaskActivity,
    runAutomationRules,
    enhancedTasks,
    serializeColumnValue,
    normalizeColumnOptions,
    normalizeProgressLinks,
    normalizeFormulaConfig,
  } = deps;

  async function removeColumn(columnId) {
    if (!canEditBoardStructure()) return;
    if (usingDemoMode || !supabase) {
      setCustomColumns((prev) => prev.filter((column) => column.id !== columnId));
      setTaskMeta((prev) => Object.fromEntries(Object.entries(prev).map(([taskId, value]) => [
        taskId,
        {
          ...value,
          customFields: Object.fromEntries(Object.entries(value.customFields || {}).filter(([key]) => key !== columnId)),
        },
      ])));
      return;
    }

    const { error } = await supabase.from('board_columns').delete().eq('id', columnId);
    if (error) {
      setErrorText(error.message);
      return;
    }

    setCustomColumns((prev) => prev.filter((column) => column.id !== columnId));
    setTaskMeta((prev) => Object.fromEntries(Object.entries(prev).map(([taskId, value]) => [
      taskId,
      {
        ...value,
        customFields: Object.fromEntries(Object.entries(value.customFields || {}).filter(([key]) => key !== columnId)),
      },
    ])));
    setPendingColumnDeleteId(null);
  }

  async function renameColumn(columnId, value) {
    if (!canEditBoardStructure()) return;
    const name = value.trim();
    if (!columnId || !name) return;

    setCustomColumns((prev) => prev.map((column) => (column.id === columnId ? { ...column, name } : column)));

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('board_columns').update({ name }).eq('id', columnId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  function resizeColumn(columnId, delta) {
    if (!canEditBoardStructure()) return;
    const column = allColumns.find((item) => item.id === columnId);
    setColumnWidths((prev) => ({
      ...prev,
      [columnId]: Math.max(
        columnId === 'item' ? 320 : 120,
        Math.min(520, (prev[columnId] || column?.defaultWidth || (columnId === 'item' ? 420 : 180)) + delta),
      ),
    }));
  }

  function toggleColumnVisibility(columnId) {
    if (!canEditBoardStructure()) return;
    setHiddenColumnIds((prev) => (
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
    ));
  }

  async function reorderColumn(columnId, targetColumnId) {
    if (!canEditBoardStructure()) return;
    const orderedColumns = [...allColumns];
    const currentIndex = orderedColumns.findIndex((column) => column.id === columnId);
    const targetIndex = orderedColumns.findIndex((column) => column.id === targetColumnId);
    if (currentIndex === -1 || targetIndex === -1 || currentIndex === targetIndex) return;

    const [moved] = orderedColumns.splice(currentIndex, 1);
    orderedColumns.splice(targetIndex, 0, moved);

    setColumnOrder(orderedColumns.map((column) => column.id));

    const customOnly = orderedColumns
      .filter((column) => column.isCustom)
      .map((column, index) => ({ ...column, position: index + 1 }));
    setCustomColumns((prev) => prev.map((column) => customOnly.find((item) => item.id === column.id) || column));

    if (usingDemoMode || !supabase) return;

    const updates = customOnly.map((column) => (
      supabase.from('board_columns').update({ position: column.position }).eq('id', column.id)
    ));
    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setErrorText(failed.error.message);
      await loadData();
    }
  }

  async function updateColumnOptions(columnId, options) {
    if (!canEditBoardStructure()) return;
    const column = customColumns.find((item) => item.id === columnId) || allColumns.find((item) => item.id === columnId);
    const normalizedOptions = column?.type === 'progress'
      ? normalizeProgressLinks(options)
      : column?.type === 'formula'
        ? normalizeFormulaConfig(options)
        : normalizeColumnOptions(options);
    setCustomColumns((prev) => prev.map((column) => (
      column.id === columnId ? { ...column, options: normalizedOptions } : column
    )));

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase
      .from('board_columns')
      .update({ options_json: normalizedOptions })
      .eq('id', columnId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function updateCustomField(taskId, columnId, value) {
    if (!canEditDeals()) return;
    const previousTask = enhancedTasks.find((item) => item.id === taskId);
    patchTaskMeta(taskId, (current) => ({
      ...current,
      customFields: { ...(current.customFields || {}), [columnId]: value },
    }));
    setSelectedTask((prev) => (
      prev && prev.id === taskId
        ? { ...prev, customFields: { ...(prev.customFields || {}), [columnId]: value } }
        : prev
    ));
    logTaskActivity(taskId, {
      type: 'field',
      title: 'Custom field updated',
      description: `${allColumns.find((column) => column.id === columnId)?.label || 'Custom field'} changed.`,
    });

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('task_column_values').upsert({
      task_id: taskId,
      board_column_id: columnId,
      value_text: serializeColumnValue(value),
    }, { onConflict: 'task_id,board_column_id' });

    if (error) {
      setErrorText(error.message);
      await loadData();
    }

    if (previousTask) {
      await runAutomationRules(previousTask, {
        ...previousTask,
        customFields: { ...(previousTask.customFields || {}), [columnId]: value },
      }, { label: 'custom field update' });
    }
  }

  function getInlineEditTargetIds(taskId) {
    if (selectedTaskIds.length > 1 && selectedTaskIds.includes(taskId)) {
      return [...selectedTaskIds];
    }
    return [taskId];
  }

  async function updateCustomFieldInline(taskId, columnId, value) {
    if (!canEditDeals()) return;
    const targetIds = getInlineEditTargetIds(taskId);
    if (targetIds.length <= 1) {
      await updateCustomField(taskId, columnId, value);
      return;
    }

    setTaskMeta((prev) => {
      const next = { ...prev };
      targetIds.forEach((targetId) => {
        const current = next[targetId] || { customFields: {}, attachments: [] };
        next[targetId] = {
          ...current,
          customFields: { ...(current.customFields || {}), [columnId]: value },
        };
      });
      return next;
    });
    setSelectedTask((prev) => (
      prev && targetIds.includes(prev.id)
        ? { ...prev, customFields: { ...(prev.customFields || {}), [columnId]: value } }
        : prev
    ));

    if (usingDemoMode || !supabase) return;

    const results = await Promise.all(
      targetIds.map((targetId) => supabase.from('task_column_values').upsert({
        task_id: targetId,
        board_column_id: columnId,
        value_text: serializeColumnValue(value),
      }, { onConflict: 'task_id,board_column_id' })),
    );

    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setErrorText(failed.error.message);
      await loadData();
    }
  }

  return {
    removeColumn,
    renameColumn,
    resizeColumn,
    toggleColumnVisibility,
    reorderColumn,
    updateColumnOptions,
    updateCustomField,
    updateCustomFieldInline,
  };
}
