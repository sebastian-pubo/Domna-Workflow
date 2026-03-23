import { useMemo } from 'react';

export function useBoardUiState({
  visibleColumns,
  columnWidths,
  boardTasks,
  boardGroups,
  boardPermissions,
  activeRoleName,
  allColumns,
}) {
  const boardGridStyle = useMemo(() => {
    const columnSizes = visibleColumns.map((column) => {
      const baseWidth = column.defaultWidth || 180;
      return Math.max(column.id === 'item' ? 320 : 120, columnWidths[column.id] || baseWidth);
    });

    return {
      gridTemplateColumns: columnSizes.map((width) => `${width}px`).join(' '),
      minWidth: `${columnSizes.reduce((sum, width) => sum + width, 0)}px`,
    };
  }, [columnWidths, visibleColumns]);

  const pinnedColumnOffsets = useMemo(() => {
    const pinnedIds = ['item'];
    let left = 0;
    const offsets = {};

    for (const column of visibleColumns) {
      if (!pinnedIds.includes(column.id)) continue;
      offsets[column.id] = left;
      const baseWidth = column.defaultWidth || 180;
      left += Math.max(column.id === 'item' ? 320 : 120, columnWidths[column.id] || baseWidth);
    }

    return offsets;
  }, [columnWidths, visibleColumns]);

  const scores = useMemo(() => {
    const people = {};

    for (const task of boardTasks) {
      const name = task.assessor || 'Unassigned';
      const entry = people[name] || { assessor: name, score: 80, tasks: 0, corrections: 0 };
      entry.tasks += 1;
      entry.score += task.status === 'Submitted' ? 6 : 0;
      entry.score += task.qa_status === 'Passed' ? 8 : 0;
      entry.score -= task.qa_status === 'Needs Correction' ? 12 : 0;
      entry.score -= !task.due_date ? 4 : 0;
      entry.score -= !task.assessor || task.assessor === 'Unassigned' ? 4 : 0;
      entry.score -= (task.issues || []).length >= 3 ? 4 : 0;
      entry.score -= task.magicplan_status === 'No' && task.status !== 'Assigned' ? 4 : 0;
      entry.corrections += task.qa_status === 'Needs Correction' ? 1 : 0;
      people[name] = entry;
    }

    return Object.values(people)
      .map((entry) => ({ ...entry, score: Math.max(0, Math.min(100, Math.round(entry.score / Math.max(entry.tasks, 1)))) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [boardTasks]);

  const canManageStructure = useMemo(() => {
    const matchingPermission = boardPermissions.find((permission) => permission.role_name === activeRoleName);
    return Boolean(matchingPermission?.can_manage_structure);
  }, [activeRoleName, boardPermissions]);

  const canEditDeals = useMemo(() => {
    const matchingPermission = boardPermissions.find((permission) => permission.role_name === activeRoleName);
    return matchingPermission ? Boolean(matchingPermission.can_edit_deals) : activeRoleName !== 'Viewer';
  }, [activeRoleName, boardPermissions]);

  const canDeleteDeals = useMemo(() => {
    const matchingPermission = boardPermissions.find((permission) => permission.role_name === activeRoleName);
    return Boolean(matchingPermission?.can_delete_deals);
  }, [activeRoleName, boardPermissions]);

  const metricCards = useMemo(() => {
    const total = boardTasks.length;
    const qaOpen = boardTasks.filter((task) => !['Passed', 'N/A'].includes(task.qa_status)).length;
    const highPriority = boardTasks.filter((task) => task.priority === 'High').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueSoon = boardTasks.filter((task) => {
      if (!task.due_date) return false;
      const diff = Math.round((new Date(`${task.due_date}T00:00:00`).getTime() - today.getTime()) / 86400000);
      return diff >= 0 && diff <= 6;
    }).length;

    return [
      { key: 'total', value: total, description: 'Across the selected board' },
      { key: 'qaOpen', value: qaOpen, description: 'Homes that still need QA attention' },
      { key: 'highPriority', value: highPriority, description: 'Items marked as high priority' },
      { key: 'dueSoon', value: dueSoon, description: 'Due in the next 7 days' },
    ];
  }, [boardTasks]);

  const stageOverview = useMemo(
    () => boardGroups.map((group) => ({
      id: group.id,
      name: group.name,
      count: boardTasks.filter((task) => task.group_id === group.id).length,
      tone: group.ui_class || 'assigned',
    })),
    [boardGroups, boardTasks],
  );

  const progressEligibleColumns = useMemo(
    () => allColumns.filter((column) => column.id !== 'item' && column.type !== 'progress' && column.type !== 'formula'),
    [allColumns],
  );

  const permissionSummary = useMemo(() => ({
    canManageStructure,
    canEditDeals,
    canDeleteDeals,
  }), [canDeleteDeals, canEditDeals, canManageStructure]);

  return {
    boardGridStyle,
    pinnedColumnOffsets,
    scores,
    canManageStructure,
    canEditDeals,
    canDeleteDeals,
    metricCards,
    stageOverview,
    progressEligibleColumns,
    permissionSummary,
  };
}
