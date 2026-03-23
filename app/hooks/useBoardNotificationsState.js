import { useEffect, useMemo, useRef } from 'react';

export function useBoardNotificationsState({
  notifications,
  selectedBoardId,
  boardTasks,
  boardReminderRules,
  loading,
  addNotification,
  makeNotification,
}) {
  const autoReminderDigestRef = useRef({});

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((notification) => notification.boardId === selectedBoardId && !notification.read).length,
    [notifications, selectedBoardId],
  );

  const boardNotifications = useMemo(
    () => notifications.filter((notification) => notification.boardId === selectedBoardId),
    [notifications, selectedBoardId],
  );

  const notificationSummary = useMemo(() => ({
    unread: boardNotifications.filter((notification) => !notification.read).length,
    warnings: boardNotifications.filter((notification) => notification.type === 'warning').length,
    mentions: boardNotifications.filter((notification) => notification.title === 'Mention').length,
  }), [boardNotifications]);

  useEffect(() => {
    if (!selectedBoardId || loading) return;

    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    today.setHours(0, 0, 0, 0);

    const overdueCount = boardReminderRules.overdue
      ? boardTasks.filter((task) => task.due_date && new Date(`${task.due_date}T00:00:00`).getTime() < today.getTime() && task.status !== 'Submitted').length
      : 0;
    const dueSoonCount = boardReminderRules.dueSoon
      ? boardTasks.filter((task) => {
        if (!task.due_date) return false;
        const dayDiff = Math.round((new Date(`${task.due_date}T00:00:00`).getTime() - today.getTime()) / 86400000);
        return dayDiff >= 0 && dayDiff <= 2;
      }).length
      : 0;
    const unassignedCount = boardReminderRules.unassigned
      ? boardTasks.filter((task) => !task.assessor || task.assessor === 'Unassigned').length
      : 0;

    const digest = `${todayKey}:${overdueCount}:${dueSoonCount}:${unassignedCount}`;
    if (autoReminderDigestRef.current[selectedBoardId] === digest) return;
    autoReminderDigestRef.current[selectedBoardId] = digest;

    const pendingNotifications = [];
    if (overdueCount > 0) {
      const body = `${overdueCount} deal${overdueCount === 1 ? '' : 's'} overdue and still active.`;
      const exists = boardNotifications.some((notification) => notification.title === 'Auto reminder' && notification.body === body && String(notification.created_at || '').startsWith(todayKey));
      if (!exists) pendingNotifications.push({ ...makeNotification('Auto reminder', body, 'warning'), dedupeKey: 'auto-overdue' });
    }
    if (dueSoonCount > 0) {
      const body = `${dueSoonCount} deal${dueSoonCount === 1 ? '' : 's'} due within the next 2 days.`;
      const exists = boardNotifications.some((notification) => notification.title === 'Auto reminder' && notification.body === body && String(notification.created_at || '').startsWith(todayKey));
      if (!exists) pendingNotifications.push({ ...makeNotification('Auto reminder', body, 'info'), dedupeKey: 'auto-due-soon' });
    }
    if (unassignedCount > 0) {
      const body = `${unassignedCount} deal${unassignedCount === 1 ? '' : 's'} still unassigned.`;
      const exists = boardNotifications.some((notification) => notification.title === 'Auto reminder' && notification.body === body && String(notification.created_at || '').startsWith(todayKey));
      if (!exists) pendingNotifications.push({ ...makeNotification('Auto reminder', body, 'warning'), dedupeKey: 'auto-unassigned' });
    }

    pendingNotifications.forEach((notification) => {
      addNotification(notification);
    });
  }, [selectedBoardId, loading, boardTasks, boardReminderRules, boardNotifications, addNotification, makeNotification]);

  return {
    unreadNotificationsCount,
    boardNotifications,
    notificationSummary,
  };
}
