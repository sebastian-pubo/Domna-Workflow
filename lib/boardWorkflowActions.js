import { appendBoardMapItem, removeBoardMapItem, replaceBoardMapItem } from './boardStateUtils';

export function createBoardWorkflowActions(deps) {
  const {
    selectedBoardId,
    selectedBoard,
    notifications,
    boardNotificationChannels,
    usingDemoMode,
    supabase,
    loadData,
    setErrorText,
    setNotifications,
    makeNotificationKey,
    canEditBoardStructure,
    canEditDeals,
    boardTasks,
    makeNotification,
    boardReminderRules,
    DEFAULT_REMINDER_RULES,
    setReminderRulesByBoard,
    templatesByBoard,
    archivedCurrentTemplates,
    setTemplatesByBoard,
    setArchivedTemplatesByBoard,
    selectedTemplateId,
    setSelectedTemplateId,
    setPendingTemplateArchiveId,
    setPendingTemplateDeleteId,
    newTemplateName,
    setNewTemplateName,
    selectedTask,
    templateDraftName,
    templateDraftCategory,
    templateDraftGroupId,
    templateDraftAssessor,
    templateDraftPriority,
    templateDraftQaStatus,
    templateDraftMagicplan,
    templateDraftNotes,
    templateDraftIssues,
    templateDraftCustomFields,
    setTemplateDraftName,
    setTemplateDraftCategory,
    setTemplateDraftGroupId,
    setTemplateDraftAssessor,
    setTemplateDraftPriority,
    setTemplateDraftQaStatus,
    setTemplateDraftMagicplan,
    setTemplateDraftNotes,
    setTemplateDraftIssues,
    setTemplateDraftCustomFields,
    automationRulesByBoard,
    archivedCurrentAutomations,
    setAutomationRulesByBoard,
    setArchivedAutomationsByBoard,
    setPendingAutomationArchiveId,
    setPendingAutomationDeleteId,
    automationDraftName,
    automationDraftTrigger,
    automationDraftField,
    automationDraftValue,
    automationDraftAction,
    automationDraftActionValue,
    setAutomationDraftName,
    setAutomationDraftTrigger,
    setAutomationDraftField,
    setAutomationDraftValue,
    setAutomationDraftAction,
    setAutomationDraftActionValue,
    addNotification: externalAddNotification,
  } = deps;

  async function addNotification(notification) {
    if (externalAddNotification) {
      return externalAddNotification(notification);
    }

    const nextNotification = {
      boardId: selectedBoardId,
      ...notification,
    };

    if (nextNotification.dedupeKey) {
      const dedupeKey = makeNotificationKey(nextNotification.boardId, nextNotification.dedupeKey, nextNotification.created_at);
      const exists = notifications.some((item) => (
        makeNotificationKey(item.boardId, item.dedupeKey || `${item.title}:${item.body}:${item.type || 'info'}`, item.created_at) === dedupeKey
      ));
      if (exists) return;
    }

    setNotifications((prev) => [nextNotification, ...prev].slice(0, 50));

    if (typeof window !== 'undefined' && selectedBoardId) {
      fetch('/api/notifications/deliver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardName: selectedBoard?.name || 'Board',
          notification: nextNotification,
          channels: boardNotificationChannels.filter((channel) => channel.enabled),
        }),
      }).catch(() => {});
    }

    if (usingDemoMode || !supabase || !selectedBoardId) return;

    const { data, error } = await supabase.from('board_notifications').insert({
      board_id: selectedBoardId,
      title: nextNotification.title,
      body: nextNotification.body,
      notification_type: nextNotification.type || 'info',
      is_read: Boolean(nextNotification.read),
      dedupe_key: nextNotification.dedupeKey || null,
    }).select().single();

    if (error) {
      setErrorText(error.message);
      return;
    }

    setNotifications((prev) => prev.map((item) => (
      item.id === nextNotification.id
        ? {
            ...item,
            id: data.id,
            boardId: data.board_id,
            created_at: data.created_at,
            dedupeKey: data.dedupe_key || item.dedupeKey,
          }
        : item
    )));
  }

  async function markNotificationRead(notificationId) {
    setNotifications((prev) => prev.map((notification) => (
      notification.id === notificationId ? { ...notification, read: true } : notification
    )));

    if (usingDemoMode || !supabase) return;
    const { error } = await supabase.from('board_notifications').update({ is_read: true }).eq('id', notificationId);
    if (error) {
      setErrorText(error.message);
    }
  }

  async function markAllNotificationsRead() {
    const unreadIds = notifications
      .filter((item) => item.boardId === selectedBoardId && !item.read)
      .map((item) => item.id);

    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((notification) => (
      unreadIds.includes(notification.id) ? { ...notification, read: true } : notification
    )));

    if (usingDemoMode || !supabase) return;
    const { error } = await supabase.from('board_notifications').update({ is_read: true }).in('id', unreadIds);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function clearAllNotifications() {
    const boardNotificationIds = notifications.filter((item) => item.boardId === selectedBoardId).map((item) => item.id);
    setNotifications((prev) => prev.filter((item) => item.boardId !== selectedBoardId));

    if (usingDemoMode || !supabase || boardNotificationIds.length === 0) return;
    const { error } = await supabase.from('board_notifications').delete().in('id', boardNotificationIds);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function createReminderSweep() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueCount = boardTasks.filter((task) => (
      task.due_date
      && new Date(`${task.due_date}T00:00:00`).getTime() < today.getTime()
      && task.status !== 'Submitted'
    )).length;
    const dueSoonCount = boardTasks.filter((task) => {
      if (!task.due_date) return false;
      const dayDiff = Math.round((new Date(`${task.due_date}T00:00:00`).getTime() - today.getTime()) / 86400000);
      return dayDiff >= 0 && dayDiff <= 2;
    }).length;
    const unassignedCount = boardTasks.filter((task) => !task.assessor || task.assessor === 'Unassigned').length;

    const notificationsToCreate = [];
    if (overdueCount > 0) {
      notificationsToCreate.push({
        ...makeNotification('Reminder sweep', `${overdueCount} deal${overdueCount === 1 ? '' : 's'} overdue and still active.`, 'warning'),
        dedupeKey: 'reminder-sweep-overdue',
      });
    }
    if (dueSoonCount > 0) {
      notificationsToCreate.push({
        ...makeNotification('Reminder sweep', `${dueSoonCount} deal${dueSoonCount === 1 ? '' : 's'} due within the next 2 days.`, 'info'),
        dedupeKey: 'reminder-sweep-due-soon',
      });
    }
    if (unassignedCount > 0) {
      notificationsToCreate.push({
        ...makeNotification('Reminder sweep', `${unassignedCount} deal${unassignedCount === 1 ? '' : 's'} still unassigned.`, 'warning'),
        dedupeKey: 'reminder-sweep-unassigned',
      });
    }

    if (notificationsToCreate.length === 0) {
      notificationsToCreate.push({
        ...makeNotification('Reminder sweep', 'No urgent reminders right now.', 'success'),
        dedupeKey: 'reminder-sweep-clear',
      });
    }

    for (const notification of notificationsToCreate) {
      // eslint-disable-next-line no-await-in-loop
      await addNotification(notification);
    }
  }

  function updateReminderRule(ruleKey, enabled) {
    if (!selectedBoardId || !canEditBoardStructure()) return;
    setReminderRulesByBoard((prev) => ({
      ...prev,
      [selectedBoardId]: {
        ...DEFAULT_REMINDER_RULES,
        ...(prev[selectedBoardId] || {}),
        [ruleKey]: enabled,
      },
    }));
  }

  function saveCurrentTaskAsTemplate() {
    if (!canEditDeals()) return;
    if (!selectedTask || !selectedBoardId) return;
    const name = newTemplateName.trim() || `${selectedTask.title} template`;
    const nextTemplate = {
      id: `template-${Date.now()}`,
      name,
      category: 'General',
      fields: {
        priority: selectedTask.priority,
        assessor: selectedTask.assessor,
        due_date: '',
        qa_status: selectedTask.qa_status,
        magicplan_status: selectedTask.magicplan_status,
        issues: selectedTask.issues || [],
        notes: selectedTask.notes || '',
      },
      customFields: { ...(selectedTask.customFields || {}) },
    };

    setTemplatesByBoard((prev) => ({
      ...prev,
      [selectedBoardId]: [...(prev[selectedBoardId] || []), nextTemplate],
    }));
    setNewTemplateName('');
    addNotification(makeNotification('Template saved', `${name} is ready to reuse in quick add.`, 'success'));

    if (usingDemoMode || !supabase) return;
    supabase.from('task_templates').insert({
      board_id: selectedBoardId,
      name,
      category: nextTemplate.category,
      payload_json: {
        category: nextTemplate.category,
        fields: nextTemplate.fields,
        customFields: nextTemplate.customFields,
      },
    }).select().single().then(({ data, error }) => {
      if (error) {
        setErrorText(error.message);
        return;
      }
      setTemplatesByBoard((prev) => ({
        ...prev,
        [selectedBoardId]: (prev[selectedBoardId] || []).map((template) => (
          template.id === nextTemplate.id ? { ...template, id: data.id, category: data.category || template.category } : template
        )),
      }));
    });
  }

  async function archiveTaskTemplate(templateId) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    const targetTemplate = (templatesByBoard[selectedBoardId] || []).find((template) => template.id === templateId);
    if (!targetTemplate) return;
    const archivedAt = new Date().toISOString();
    setTemplatesByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, templateId));
    setArchivedTemplatesByBoard((prev) => appendBoardMapItem(prev, selectedBoardId, { ...targetTemplate, archived_at: archivedAt }));
    if (selectedTemplateId === templateId) setSelectedTemplateId('');
    setPendingTemplateArchiveId(null);
    setPendingTemplateDeleteId(null);

    if (usingDemoMode || !supabase) return;
    const { error } = await supabase.from('task_templates').update({ archived_at: archivedAt }).eq('id', templateId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function deleteTaskTemplatePermanently(templateId) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    setTemplatesByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, templateId));
    setArchivedTemplatesByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, templateId));
    if (selectedTemplateId === templateId) setSelectedTemplateId('');
    setPendingTemplateArchiveId(null);
    setPendingTemplateDeleteId(null);

    if (usingDemoMode || !supabase) return;
    const { error } = await supabase.from('task_templates').delete().eq('id', templateId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function restoreTaskTemplate(templateId) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    const archivedTemplate = archivedCurrentTemplates.find((template) => template.id === templateId);
    if (!archivedTemplate) return;
    setArchivedTemplatesByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, templateId));
    setTemplatesByBoard((prev) => appendBoardMapItem(prev, selectedBoardId, { ...archivedTemplate, archived_at: null }));

    if (usingDemoMode || !supabase) return;
    const { error } = await supabase.from('task_templates').update({ archived_at: null }).eq('id', templateId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function createTemplateFromDraft() {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    const name = templateDraftName.trim();
    if (!name) return;

    const nextTemplate = {
      id: `template-${Date.now()}`,
      name,
      category: templateDraftCategory.trim() || 'General',
      fields: {
        priority: templateDraftPriority,
        assessor: templateDraftAssessor,
        due_date: '',
        qa_status: templateDraftQaStatus,
        magicplan_status: templateDraftMagicplan,
        issues: templateDraftIssues
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        notes: templateDraftNotes,
        group_id: templateDraftGroupId || '',
      },
      customFields: templateDraftCustomFields,
    };

    setTemplatesByBoard((prev) => ({
      ...prev,
      [selectedBoardId]: [...(prev[selectedBoardId] || []), nextTemplate],
    }));
    setTemplateDraftName('');
    setTemplateDraftCategory('General');
    setTemplateDraftGroupId('');
    setTemplateDraftAssessor('Unassigned');
    setTemplateDraftPriority('Medium');
    setTemplateDraftQaStatus('Pending');
    setTemplateDraftMagicplan('No');
    setTemplateDraftNotes('');
    setTemplateDraftIssues('');
    setTemplateDraftCustomFields({});
    addNotification(makeNotification('Template saved', `${name} is ready to use in quick add.`, 'success'));

    if (usingDemoMode || !supabase) return;
    const { data, error } = await supabase.from('task_templates').insert({
      board_id: selectedBoardId,
      name,
      category: nextTemplate.category,
      payload_json: {
        fields: nextTemplate.fields,
        customFields: nextTemplate.customFields,
        category: nextTemplate.category,
      },
    }).select().single();
    if (error) {
      setErrorText(error.message);
      await loadData();
      return;
    }

    setTemplatesByBoard((prev) => ({
      ...prev,
      [selectedBoardId]: (prev[selectedBoardId] || []).map((template) => (
        template.id === nextTemplate.id ? { ...template, id: data.id, category: data.category || template.category } : template
      )),
    }));
  }

  async function addAutomationRule() {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId || !automationDraftName.trim()) return;

    const nextRule = {
      id: `automation-${Date.now()}`,
      name: automationDraftName.trim(),
      trigger: automationDraftTrigger,
      field: automationDraftField,
      value: automationDraftValue,
      action: automationDraftAction,
      actionValue: automationDraftActionValue,
    };

    setAutomationRulesByBoard((prev) => ({
      ...prev,
      [selectedBoardId]: [...(prev[selectedBoardId] || []), nextRule],
    }));

    setAutomationDraftName('');
    setAutomationDraftTrigger('field_equals');
    setAutomationDraftField('status');
    setAutomationDraftValue('');
    setAutomationDraftAction('notify');
    setAutomationDraftActionValue('');

    if (usingDemoMode || !supabase) return;
    const { data, error } = await supabase.from('automation_rules').insert({
      board_id: selectedBoardId,
      name: nextRule.name,
      trigger_type: nextRule.trigger,
      trigger_field: nextRule.field,
      trigger_value: nextRule.value,
      action_type: nextRule.action,
      action_value: nextRule.actionValue,
    }).select().single();
    if (error) {
      setErrorText(error.message);
      return;
    }
    setAutomationRulesByBoard((prev) => ({
      ...prev,
      [selectedBoardId]: (prev[selectedBoardId] || []).map((rule) => (
        rule.id === nextRule.id ? { ...rule, id: data.id } : rule
      )),
    }));
  }

  async function archiveAutomationRule(ruleId) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    const targetRule = (automationRulesByBoard[selectedBoardId] || []).find((rule) => rule.id === ruleId);
    if (!targetRule) return;
    const archivedAt = new Date().toISOString();
    setAutomationRulesByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, ruleId));
    setArchivedAutomationsByBoard((prev) => appendBoardMapItem(prev, selectedBoardId, { ...targetRule, archived_at: archivedAt }));
    setPendingAutomationArchiveId(null);
    setPendingAutomationDeleteId(null);

    if (usingDemoMode || !supabase) return;
    const { error } = await supabase.from('automation_rules').update({ archived_at: archivedAt }).eq('id', ruleId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function deleteAutomationRulePermanently(ruleId) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    setAutomationRulesByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, ruleId));
    setArchivedAutomationsByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, ruleId));
    setPendingAutomationArchiveId(null);
    setPendingAutomationDeleteId(null);

    if (usingDemoMode || !supabase) return;
    const { error } = await supabase.from('automation_rules').delete().eq('id', ruleId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function restoreAutomationRule(ruleId) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    const archivedRule = archivedCurrentAutomations.find((rule) => rule.id === ruleId);
    if (!archivedRule) return;
    setArchivedAutomationsByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, ruleId));
    setAutomationRulesByBoard((prev) => appendBoardMapItem(prev, selectedBoardId, { ...archivedRule, archived_at: null }));

    if (usingDemoMode || !supabase) return;
    const { error } = await supabase.from('automation_rules').update({ archived_at: null }).eq('id', ruleId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  function applyAutomationPreset(preset) {
    setAutomationDraftName(preset.name);
    setAutomationDraftTrigger(preset.trigger);
    setAutomationDraftField(preset.field || 'status');
    setAutomationDraftValue(preset.value || '');
    setAutomationDraftAction(preset.action);
    setAutomationDraftActionValue(preset.actionValue || '');
  }

  return {
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearAllNotifications,
    createReminderSweep,
    updateReminderRule,
    saveCurrentTaskAsTemplate,
    archiveTaskTemplate,
    deleteTaskTemplatePermanently,
    restoreTaskTemplate,
    createTemplateFromDraft,
    addAutomationRule,
    archiveAutomationRule,
    deleteAutomationRulePermanently,
    restoreAutomationRule,
    applyAutomationPreset,
  };
}
