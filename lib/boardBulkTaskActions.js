export function createBoardBulkTaskActions(deps) {
  const {
    canEditDeals,
    canDeleteDeals,
    selectedTaskIds,
    allDisplayedTaskIds,
    usingDemoMode,
    supabase,
    loadData,
    setErrorText,
    setTasks,
    setSelectedTask,
    setSelectedTaskIds,
    tasks,
    boardGroups,
    compareTasks,
  } = deps;

  function toggleTaskSelection(taskId) {
    if (!canEditDeals()) return;
    setSelectedTaskIds((prev) => (
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    ));
  }

  function toggleAllDisplayedSelection() {
    if (!canEditDeals()) return;
    if (allDisplayedTaskIds.length === 0) return;

    setSelectedTaskIds((prev) => {
      const allSelected = allDisplayedTaskIds.every((taskId) => prev.includes(taskId));
      if (allSelected) {
        return prev.filter((taskId) => !allDisplayedTaskIds.includes(taskId));
      }

      return Array.from(new Set([...prev, ...allDisplayedTaskIds]));
    });
  }

  async function bulkArchiveSelected() {
    if (!canDeleteDeals()) return;
    if (selectedTaskIds.length === 0) return;

    const activeSelection = [...selectedTaskIds];
    const archivedAt = new Date().toISOString();
    setTasks((prev) => prev.map((task) => (
      activeSelection.includes(task.id)
        ? { ...task, archived_at: archivedAt }
        : task
    )));
    setSelectedTask((prev) => (prev && activeSelection.includes(prev.id) ? null : prev));
    setSelectedTaskIds([]);

    if (usingDemoMode || !supabase) return;

    const updates = await Promise.all(
      activeSelection.map((taskId) => supabase.from('tasks').update({ archived_at: archivedAt }).eq('id', taskId)),
    );

    const failed = updates.find((result) => result.error);
    if (failed?.error) {
      setErrorText(failed.error.message);
      await loadData();
    }
  }

  async function bulkDeleteSelected() {
    if (!canDeleteDeals()) return;
    if (selectedTaskIds.length === 0) return;

    const deletingIds = [...selectedTaskIds];
    setTasks((prev) => prev.filter((task) => !deletingIds.includes(task.id)));
    setSelectedTask((prev) => (prev && deletingIds.includes(prev.id) ? null : prev));
    setSelectedTaskIds([]);

    if (usingDemoMode || !supabase) return;

    const deletes = await Promise.all(
      deletingIds.map((taskId) => supabase.from('tasks').delete().eq('id', taskId)),
    );

    const failed = deletes.find((result) => result.error);
    if (failed?.error) {
      setErrorText(failed.error.message);
      await loadData();
    }
  }

  async function bulkMoveSelected(targetGroupId) {
    if (!canEditDeals()) return;
    if (!targetGroupId || selectedTaskIds.length === 0) return;

    const targetGroup = boardGroups.find((group) => group.id === targetGroupId);
    if (!targetGroup) return;

    const activeSelection = [...selectedTaskIds];
    const nextTasks = tasks.map((task) => ({ ...task }));
    const impactedGroupIds = new Set([targetGroupId]);

    for (const taskId of activeSelection) {
      const task = nextTasks.find((item) => item.id === taskId);
      if (!task) continue;
      impactedGroupIds.add(task.group_id);
      task.group_id = targetGroupId;
      task.status = targetGroup.name;
    }

    const rebalancedTasks = nextTasks.map((task) => {
      if (!impactedGroupIds.has(task.group_id)) return task;
      const groupItems = nextTasks.filter((candidate) => candidate.group_id === task.group_id).sort(compareTasks);
      return { ...task, position: groupItems.findIndex((candidate) => candidate.id === task.id) + 1 };
    });

    setTasks(rebalancedTasks);
    setSelectedTask((prev) => (prev && activeSelection.includes(prev.id) ? { ...prev, group_id: targetGroupId, status: targetGroup.name } : prev));
    setSelectedTaskIds([]);

    if (usingDemoMode || !supabase) return;

    const updates = rebalancedTasks.filter((task) => impactedGroupIds.has(task.group_id));
    const results = await Promise.all(
      updates.map((task) => supabase.from('tasks').update({
        group_id: task.group_id,
        status: task.status,
        position: task.position || 0,
      }).eq('id', task.id)),
    );

    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setErrorText(failed.error.message);
      await loadData();
    }
  }

  async function bulkUpdateField(field, value) {
    if (!canEditDeals()) return;
    if (!field || selectedTaskIds.length === 0) return;

    const activeSelection = [...selectedTaskIds];
    setTasks((prev) => prev.map((task) => (
      activeSelection.includes(task.id)
        ? { ...task, [field]: value }
        : task
    )));
    setSelectedTask((prev) => (prev && activeSelection.includes(prev.id) ? { ...prev, [field]: value } : prev));

    if (usingDemoMode || !supabase) return;

    const updates = await Promise.all(
      activeSelection.map((taskId) => supabase.from('tasks').update({ [field]: value }).eq('id', taskId)),
    );

    const failed = updates.find((result) => result.error);
    if (failed?.error) {
      setErrorText(failed.error.message);
      await loadData();
    }
  }

  return {
    toggleTaskSelection,
    toggleAllDisplayedSelection,
    bulkArchiveSelected,
    bulkDeleteSelected,
    bulkMoveSelected,
    bulkUpdateField,
  };
}
