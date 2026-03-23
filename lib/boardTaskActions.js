export function createBoardTaskActions(deps) {
  const {
    canEditDeals,
    canDeleteDeals,
    enhancedTasks,
    boardGroups,
    tasks,
    selectedTask,
    selectedTaskIds,
    usingDemoMode,
    supabase,
    loadData,
    setErrorText,
    setTasks,
    setSelectedTask,
    setDraggedTaskId,
    patchTask,
    patchTaskMeta,
    persistTask,
    logTaskActivity,
    runAutomationRules,
    compareTasks,
    timelineRange,
    uploadCategory,
    addNotification,
    makeNotification,
    parseIssuesInput,
    getIssuesInputValue,
    removeTaskLocally,
  } = deps;

  function getInlineEditTargetIds(taskId) {
    if (selectedTaskIds.length > 1 && selectedTaskIds.includes(taskId)) {
      return [...selectedTaskIds];
    }
    return [taskId];
  }

  async function updateTaskField(taskId, field, value) {
    const task = enhancedTasks.find((item) => item.id === taskId);
    if (!task) return;

    if (field === 'status') {
      const nextGroup = boardGroups.find((group) => group.name === value);
      const nextTask = { ...task, status: value, group_id: nextGroup?.id || task.group_id };
      patchTask(taskId, (current) => ({ ...current, status: value, group_id: nextGroup?.id || current.group_id }));
      logTaskActivity(taskId, { type: 'field', title: 'Stage updated', description: `${task.status} -> ${value}` });
      await persistTask(taskId, { status: value, group_id: nextGroup?.id || task.group_id });
      await runAutomationRules(task, nextTask, { label: field });
      return;
    }

    patchTask(taskId, (current) => ({ ...current, [field]: value }));
    logTaskActivity(taskId, { type: 'field', title: 'Field updated', description: `${field.replace(/_/g, ' ')} changed to ${value || 'empty'}.` });
    await persistTask(taskId, { [field]: field === 'due_date' ? value || null : value });
    await runAutomationRules(task, { ...task, [field]: value }, { label: field });
  }

  async function updateTaskFieldInline(taskId, field, value) {
    const targetIds = getInlineEditTargetIds(taskId);
    if (targetIds.length <= 1) {
      await updateTaskField(taskId, field, value);
      return;
    }

    if (field === 'status') {
      const targetGroup = boardGroups.find((group) => group.name === value);
      if (!targetGroup) return;

      const nextTasks = tasks.map((task) => ({ ...task }));
      const impactedGroupIds = new Set([targetGroup.id]);

      for (const targetId of targetIds) {
        const targetTask = nextTasks.find((item) => item.id === targetId);
        if (!targetTask) continue;
        impactedGroupIds.add(targetTask.group_id);
        targetTask.group_id = targetGroup.id;
        targetTask.status = targetGroup.name;
      }

      const rebalancedTasks = nextTasks.map((task) => {
        if (!impactedGroupIds.has(task.group_id)) return task;
        const groupItems = nextTasks.filter((candidate) => candidate.group_id === task.group_id).sort(compareTasks);
        return { ...task, position: groupItems.findIndex((candidate) => candidate.id === task.id) + 1 };
      });

      setTasks(rebalancedTasks);
      setSelectedTask((prev) => (
        prev && targetIds.includes(prev.id)
          ? { ...prev, status: targetGroup.name, group_id: targetGroup.id }
          : prev
      ));

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
      return;
    }

    setTasks((prev) => prev.map((task) => (
      targetIds.includes(task.id)
        ? { ...task, [field]: value }
        : task
    )));
    setSelectedTask((prev) => (
      prev && targetIds.includes(prev.id)
        ? { ...prev, [field]: value }
        : prev
    ));

    if (usingDemoMode || !supabase) return;

    const updates = await Promise.all(
      targetIds.map((targetId) => supabase.from('tasks').update({
        [field]: field === 'due_date' ? value || null : value,
      }).eq('id', targetId)),
    );

    const failed = updates.find((result) => result.error);
    if (failed?.error) {
      setErrorText(failed.error.message);
      await loadData();
    }
  }

  async function moveTaskToCalendarDate(taskId, targetDate) {
    if (!canEditDeals()) return;
    await updateTaskFieldInline(taskId, 'due_date', targetDate === 'No due date' ? '' : targetDate);
    setDraggedTaskId(null);
  }

  async function moveTaskToTimelinePosition(taskId, clientX, bounds) {
    if (!canEditDeals() || !bounds || !timelineRange.startMs || !timelineRange.endMs) return;
    const width = Math.max(bounds.width || 0, 1);
    const relativeX = Math.min(Math.max(clientX - bounds.left, 0), width);
    const ratio = relativeX / width;
    const targetMs = timelineRange.startMs + ((timelineRange.endMs - timelineRange.startMs) * ratio);
    const targetDate = new Date(targetMs);
    targetDate.setHours(0, 0, 0, 0);
    await updateTaskFieldInline(taskId, 'due_date', targetDate.toISOString().slice(0, 10));
    setDraggedTaskId(null);
  }

  async function uploadFiles(event) {
    if (!canEditDeals()) return;
    if (!selectedTask) return;
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const previousTask = enhancedTasks.find((item) => item.id === selectedTask.id) || selectedTask;

    if (!usingDemoMode && supabase) {
      const uploadedAttachments = [];

      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
        const filePath = `${selectedTask.id}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage.from('task-files').upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

        if (uploadError) {
          setErrorText(uploadError.message);
          continue;
        }

        const { data: publicUrlData } = supabase.storage.from('task-files').getPublicUrl(filePath);
        const nextAttachment = {
          task_id: selectedTask.id,
          file_name: file.name,
          file_path: filePath,
          file_url: publicUrlData.publicUrl,
          file_size: file.size,
          content_type: file.type || '',
          category: uploadCategory,
        };

        const { data: attachmentRow, error: attachmentError } = await supabase.from('task_attachments').insert(nextAttachment).select().single();
        if (attachmentError) {
          setErrorText(attachmentError.message);
          continue;
        }

        uploadedAttachments.push({
          id: attachmentRow.id,
          name: attachmentRow.file_name,
          path: attachmentRow.file_path,
          url: attachmentRow.file_url,
          size: attachmentRow.file_size || 0,
          contentType: attachmentRow.content_type || '',
          category: attachmentRow.category || uploadCategory,
          uploadedAt: attachmentRow.created_at,
        });
      }

      if (uploadedAttachments.length) {
        patchTaskMeta(selectedTask.id, (current) => ({
          ...current,
          attachments: [...(current.attachments || []), ...uploadedAttachments],
        }));
        setSelectedTask((prev) => prev ? { ...prev, attachments: [...(prev.attachments || []), ...uploadedAttachments] } : prev);
        logTaskActivity(selectedTask.id, { type: 'file', title: 'Files uploaded', description: `${uploadedAttachments.length} file${uploadedAttachments.length === 1 ? '' : 's'} uploaded.` });
        addNotification(makeNotification('Files uploaded', `${uploadedAttachments.length} file${uploadedAttachments.length === 1 ? '' : 's'} added to ${selectedTask.title}.`, 'success'));
        await runAutomationRules(previousTask, { ...previousTask, attachments: [...(previousTask.attachments || []), ...uploadedAttachments] }, {
          label: 'file upload',
          fileCountBefore: (previousTask.attachments || []).length,
          fileCountAfter: (previousTask.attachments || []).length + uploadedAttachments.length,
        });
      }

      event.target.value = '';
      return;
    }

    const attachments = files.map((file) => ({
      id: `file-${Date.now()}-${file.name}`,
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
      category: uploadCategory,
      uploadedAt: new Date().toISOString(),
    }));

    patchTaskMeta(selectedTask.id, (current) => ({
      ...current,
      attachments: [...(current.attachments || []), ...attachments],
    }));

    setSelectedTask((prev) => prev ? { ...prev, attachments: [...(prev.attachments || []), ...attachments] } : prev);
    logTaskActivity(selectedTask.id, { type: 'file', title: 'Files uploaded', description: `${attachments.length} file${attachments.length === 1 ? '' : 's'} uploaded.` });
    addNotification(makeNotification('Files uploaded', `${attachments.length} file${attachments.length === 1 ? '' : 's'} added to ${selectedTask.title}.`, 'success'));
    await runAutomationRules(previousTask, { ...previousTask, attachments: [...(previousTask.attachments || []), ...attachments] }, {
      label: 'file upload',
      fileCountBefore: (previousTask.attachments || []).length,
      fileCountAfter: (previousTask.attachments || []).length + attachments.length,
    });
    event.target.value = '';
  }

  async function removeAttachment(attachment) {
    if (!canEditDeals()) return;
    if (!selectedTask) return;

    patchTaskMeta(selectedTask.id, (current) => ({
      ...current,
      attachments: (current.attachments || []).filter((item) => item.id !== attachment.id),
    }));
    setSelectedTask((prev) => prev ? { ...prev, attachments: (prev.attachments || []).filter((item) => item.id !== attachment.id) } : prev);

    if (usingDemoMode || !supabase || !attachment.path) return;

    const [{ error: storageError }, { error: rowError }] = await Promise.all([
      supabase.storage.from('task-files').remove([attachment.path]),
      supabase.from('task_attachments').delete().eq('id', attachment.id),
    ]);

    if (storageError || rowError) {
      setErrorText(storageError?.message || rowError?.message || 'Failed to remove file.');
      await loadData();
    }
  }

  async function saveTaskChanges() {
    if (!canEditDeals()) return;
    if (!selectedTask) return;
    const previousTask = enhancedTasks.find((item) => item.id === selectedTask.id) || selectedTask;
    const nextIssues = parseIssuesInput(getIssuesInputValue(selectedTask));
    patchTask(selectedTask.id, (current) => ({
      ...current,
      title: selectedTask.title,
      assessor: selectedTask.assessor,
      due_date: selectedTask.due_date,
      qa_status: selectedTask.qa_status,
      magicplan_status: selectedTask.magicplan_status,
      notes: selectedTask.notes,
      issues: nextIssues,
      issueDraft: undefined,
      priority: selectedTask.priority,
    }));
    logTaskActivity(selectedTask.id, { type: 'task', title: 'Deal saved', description: 'Core deal details were updated.' });

    const ok = await persistTask(selectedTask.id, {
      title: selectedTask.title,
      assessor: selectedTask.assessor,
      due_date: selectedTask.due_date || null,
      qa_status: selectedTask.qa_status,
      magicplan_status: selectedTask.magicplan_status,
      notes: selectedTask.notes,
      issues: nextIssues,
      priority: selectedTask.priority,
    });

    if (ok) {
      await runAutomationRules(previousTask, { ...previousTask, ...selectedTask, issues: nextIssues }, { label: 'deal save' });
      setSelectedTask(null);
    }
  }

  async function archiveSelectedTask() {
    if (!canDeleteDeals()) return;
    if (!selectedTask) return;

    const archivedAt = new Date().toISOString();
    patchTask(selectedTask.id, (current) => ({
      ...current,
      archived_at: archivedAt,
    }));

    if (usingDemoMode || !supabase) {
      setSelectedTask(null);
      return;
    }

    const ok = await persistTask(selectedTask.id, { archived_at: archivedAt });
    if (ok) setSelectedTask(null);
  }

  async function deleteSelectedTask() {
    if (!canDeleteDeals()) return;
    if (!selectedTask) return;

    const taskId = selectedTask.id;

    if (usingDemoMode || !supabase) {
      removeTaskLocally(taskId);
      return;
    }

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      setErrorText(error.message);
      return;
    }

    removeTaskLocally(taskId);
  }

  return {
    updateTaskField,
    updateTaskFieldInline,
    moveTaskToCalendarDate,
    moveTaskToTimelinePosition,
    uploadFiles,
    removeAttachment,
    saveTaskChanges,
    archiveSelectedTask,
    deleteSelectedTask,
  };
}
