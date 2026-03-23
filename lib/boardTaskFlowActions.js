export function createBoardTaskFlowActions(deps) {
  const {
    canEditDeals,
    enhancedTasks,
    boardGroups,
    tasks,
    groups,
    boardTemplates,
    selectedTemplateId,
    newTaskGroupId,
    newTaskTitle,
    newTaskAssessor,
    usingDemoMode,
    supabase,
    loadData,
    setErrorText,
    setTasks,
    setSelectedTask,
    setCommentsByTask,
    setTaskMeta,
    setNewTaskTitle,
    setNewTaskAssessor,
    setSelectedTemplateId,
    selectedTask,
    newComment,
    setNewComment,
    assessorDirectory,
    addNotification,
    makeNotification,
    runAutomationRules,
    logTaskActivity,
    compareTasks,
    boardColumns,
    serializeColumnValue,
    persistTask,
    parseIssuesInput,
  } = deps;

  function patchTask(taskId, updater) {
    setTasks((prev) => prev.map((task) => (
      task.id === taskId ? updater(task) : task
    )));
    setSelectedTask((prev) => (
      prev && prev.id === taskId ? updater(prev) : prev
    ));
  }

  function removeTaskLocally(taskId) {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setCommentsByTask((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== taskId)));
    setTaskMeta((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== taskId)));
    setSelectedTask((prev) => (prev && prev.id === taskId ? null : prev));
  }

  function patchTaskMeta(taskId, updater) {
    setTaskMeta((prev) => ({ ...prev, [taskId]: updater(prev[taskId] || { customFields: {}, attachments: [] }) }));
  }

  function updateIssueDraft(taskId, value) {
    patchTaskMeta(taskId, (current) => ({
      ...current,
      issueDraft: value,
    }));
    setSelectedTask((prev) => (prev && prev.id === taskId ? { ...prev, issueDraft: value } : prev));
  }

  async function commitIssueDraft(taskId, value) {
    const nextIssues = parseIssuesInput(value);
    const previousTask = enhancedTasks.find((item) => item.id === taskId);
    patchTaskMeta(taskId, (current) => {
      const next = { ...current };
      delete next.issueDraft;
      return next;
    });
    patchTask(taskId, (current) => ({
      ...current,
      issues: nextIssues,
      issueDraft: undefined,
    }));
    logTaskActivity(taskId, { type: 'field', title: 'Issues updated', description: `${nextIssues.length} issue tag${nextIssues.length === 1 ? '' : 's'} saved.` });
    await persistTask(taskId, { issues: nextIssues });
    await runAutomationRules(previousTask, { ...previousTask, issues: nextIssues }, { label: 'issues update' });
  }

  async function moveTask(taskId, targetGroupId) {
    if (!canEditDeals()) return;
    return moveTaskBefore(taskId, targetGroupId, null);
  }

  async function moveTaskBefore(taskId, targetGroupId, beforeTaskId) {
    if (!canEditDeals()) return;
    const task = enhancedTasks.find((item) => item.id === taskId);
    const targetGroup = boardGroups.find((group) => group.id === targetGroupId);
    if (!task || !targetGroup) return;

    const sourceGroupId = task.group_id;
    const nextTasks = [...tasks];
    const movingTaskIndex = nextTasks.findIndex((item) => item.id === taskId);
    if (movingTaskIndex === -1) return;

    const movingTask = {
      ...nextTasks[movingTaskIndex],
      group_id: targetGroupId,
      status: targetGroup.name,
    };

    nextTasks.splice(movingTaskIndex, 1);

    const targetIndices = nextTasks.reduce((list, item, index) => (
      item.group_id === targetGroupId ? [...list, index] : list
    ), []);

    let insertIndex = targetIndices.length ? targetIndices[targetIndices.length - 1] + 1 : nextTasks.length;
    if (beforeTaskId) {
      const beforeIndex = nextTasks.findIndex((item) => item.id === beforeTaskId);
      if (beforeIndex >= 0) insertIndex = beforeIndex;
    }

    nextTasks.splice(insertIndex, 0, movingTask);

    const impactedGroupIds = Array.from(new Set([sourceGroupId, targetGroupId]));
    const rebalancedTasks = nextTasks.map((item) => {
      if (!impactedGroupIds.includes(item.group_id)) return item;

      const groupItems = nextTasks.filter((candidate) => candidate.group_id === item.group_id).sort(compareTasks);
      const position = groupItems.findIndex((candidate) => candidate.id === item.id) + 1;
      return { ...item, position };
    });

    setTasks(rebalancedTasks);
    setSelectedTask((prev) => {
      if (!prev || prev.id !== taskId) return prev;
      const updated = rebalancedTasks.find((item) => item.id === taskId);
      return updated ? { ...prev, ...updated } : prev;
    });

    if (usingDemoMode || !supabase) return;

    const updates = rebalancedTasks.filter((item) => impactedGroupIds.includes(item.group_id));
    const results = await Promise.all(
      updates.map((item) => supabase.from('tasks').update({
        group_id: item.group_id,
        status: item.status,
        position: item.position || 0,
      }).eq('id', item.id)),
    );

    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setErrorText(failed.error.message);
      await loadData();
    }
  }

  async function addTask() {
    if (!canEditDeals()) return;
    if (!newTaskTitle.trim()) return;
    const selectedTemplate = boardTemplates.find((template) => template.id === selectedTemplateId) || null;
    const templateFields = selectedTemplate?.fields || {};
    const templateCustomFields = selectedTemplate?.customFields || {};
    const groupId = newTaskGroupId || templateFields.group_id || boardGroups[0]?.id;
    if (!groupId) return;
    const group = groups.find((item) => item.id === groupId);
    const nextPosition = tasks.filter((task) => task.group_id === groupId).length + 1;

    if (usingDemoMode || !supabase) {
      const nextTaskId = `demo-${Date.now()}`;
      setTasks((prev) => [
        {
          id: nextTaskId,
          group_id: groupId,
          position: nextPosition,
          title: newTaskTitle.trim(),
          status: group?.name || 'Assigned',
          priority: templateFields.priority || 'Medium',
          assessor: newTaskAssessor || templateFields.assessor || 'Unassigned',
          due_date: templateFields.due_date || '',
          qa_status: templateFields.qa_status || 'Pending',
          magicplan_status: templateFields.magicplan_status || 'No',
          issues: templateFields.issues || [],
          notes: templateFields.notes || '',
        },
        ...prev,
      ]);
      if (Object.keys(templateCustomFields).length > 0) {
        patchTaskMeta(nextTaskId, (current) => ({
          ...current,
          customFields: templateCustomFields,
        }));
      }
      logTaskActivity(nextTaskId, { type: 'task', title: 'Deal created', description: 'A new deal was created from quick add.' });
      setNewTaskTitle('');
      setNewTaskAssessor('Unassigned');
      setSelectedTemplateId('');
      return;
    }

    const { data, error } = await supabase.from('tasks').insert({
      group_id: groupId,
      position: nextPosition,
      title: newTaskTitle.trim(),
      status: group?.name || 'Assigned',
      priority: templateFields.priority || 'Medium',
      assessor: newTaskAssessor || templateFields.assessor || 'Unassigned',
      due_date: templateFields.due_date || null,
      qa_status: templateFields.qa_status || 'Pending',
      magicplan_status: templateFields.magicplan_status || 'No',
      issues: templateFields.issues || [],
      notes: templateFields.notes || '',
    }).select().single();

    if (error) {
      setErrorText(error.message);
      return;
    }

    if (data && Object.keys(templateCustomFields).length > 0) {
      await Promise.all(
        Object.entries(templateCustomFields).map(([columnId, value]) => supabase.from('task_column_values').upsert({
          task_id: data.id,
          board_column_id: columnId,
          value_text: serializeColumnValue(value),
        }, { onConflict: 'task_id,board_column_id' })),
      );
    }

    setNewTaskTitle('');
    setNewTaskAssessor('Unassigned');
    setSelectedTemplateId('');
    await loadData();
  }

  async function addComment() {
    if (!canEditDeals()) return;
    if (!selectedTask || !newComment.trim()) return;
    const previousTask = enhancedTasks.find((item) => item.id === selectedTask.id) || selectedTask;
    const commentText = newComment.trim();

    const nextComment = {
      id: `comment-${Date.now()}`,
      task_id: selectedTask.id,
      author: 'Domna Team',
      text: commentText,
      created_at: new Date().toISOString(),
    };
    const mentionMatches = commentText.match(/@([a-zA-Z0-9._-]+)/g) || [];
    const mentionedPeople = assessorDirectory.filter((assessor) => mentionMatches.some((mention) => mention.slice(1).toLowerCase() === assessor.name.toLowerCase().split(' ')[0]));

    if (usingDemoMode || !supabase) {
      setCommentsByTask((prev) => ({ ...prev, [selectedTask.id]: [...(prev[selectedTask.id] || []), nextComment] }));
      setSelectedTask((prev) => prev ? { ...prev, comments: [...(prev.comments || []), nextComment] } : prev);
      logTaskActivity(selectedTask.id, { type: 'comment', title: 'Update added', description: commentText.slice(0, 80) });
      addNotification(makeNotification('New update', `New update added on ${selectedTask.title}.`, 'info'));
      mentionedPeople.forEach((person) => addNotification(makeNotification('Mention', `${person.name} was mentioned on ${selectedTask.title}.`, 'info')));
      setNewComment('');
      await runAutomationRules(previousTask, { ...previousTask, comments: [...(previousTask.comments || []), nextComment] }, {
        label: 'comment',
        commentCountBefore: (previousTask.comments || []).length,
        commentCountAfter: (previousTask.comments || []).length + 1,
      });
      return;
    }

    const { error } = await supabase.from('comments').insert({
      task_id: selectedTask.id,
      author: 'Domna Team',
      text: commentText,
    });

    if (error) {
      setErrorText(error.message);
      return;
    }

    logTaskActivity(selectedTask.id, { type: 'comment', title: 'Update added', description: commentText.slice(0, 80) });
    addNotification(makeNotification('New update', `New update added on ${selectedTask.title}.`, 'info'));
    mentionedPeople.forEach((person) => addNotification(makeNotification('Mention', `${person.name} was mentioned on ${selectedTask.title}.`, 'info')));
    setNewComment('');
    await runAutomationRules(previousTask, { ...previousTask, comments: [...(previousTask.comments || []), nextComment] }, {
      label: 'comment',
      commentCountBefore: (previousTask.comments || []).length,
      commentCountAfter: (previousTask.comments || []).length + 1,
    });
    await loadData();
  }

  async function duplicateTask(task) {
    if (!canEditDeals()) return;
    if (!task) return;

    const duplicateTitle = `${task.title} copy`;
    const groupId = task.group_id;
    const nextPosition = tasks.filter((item) => item.group_id === groupId).length + 1;

    if (usingDemoMode || !supabase) {
      const nextTask = {
        ...task,
        id: `task-${Date.now()}`,
        title: duplicateTitle,
        position: nextPosition,
        comments: [],
        attachments: [],
      };
      setTasks((prev) => [nextTask, ...prev]);
      patchTaskMeta(nextTask.id, () => ({ customFields: { ...(task.customFields || {}) }, attachments: [] }));
      return;
    }

    const { data, error } = await supabase.from('tasks').insert({
      group_id: groupId,
      title: duplicateTitle,
      position: nextPosition,
      status: task.status,
      priority: task.priority,
      assessor: task.assessor,
      due_date: task.due_date || null,
      qa_status: task.qa_status,
      magicplan_status: task.magicplan_status,
      issues: task.issues || [],
      notes: task.notes || '',
    }).select().single();

    if (error) {
      setErrorText(error.message);
      return;
    }

    if (boardColumns.length) {
      const customFieldRows = boardColumns
        .map((column) => ({
          task_id: data.id,
          board_column_id: column.id,
          value_text: serializeColumnValue(task.customFields?.[column.id] || ''),
        }))
        .filter((row) => row.value_text);

      if (customFieldRows.length) {
        const { error: valuesError } = await supabase.from('task_column_values').insert(customFieldRows);
        if (valuesError) setErrorText(valuesError.message);
      }
    }

    await loadData();
  }

  return {
    patchTask,
    removeTaskLocally,
    patchTaskMeta,
    updateIssueDraft,
    commitIssueDraft,
    moveTask,
    moveTaskBefore,
    addTask,
    addComment,
    duplicateTask,
  };
}
