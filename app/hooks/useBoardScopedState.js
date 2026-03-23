import { useMemo } from 'react';

export function useBoardScopedState({
  boards,
  selectedBoardId,
  groups,
  customColumns,
  columnOrder,
  hiddenColumnIds,
  savedViews,
  workspaceViewsByBoard,
  normalizeWorkspaceViews,
  defaultWorkspaceViews,
  archivedWorkspaceViewsByBoard,
  archivedSavedViewsByBoard,
  archivedGroupsByBoard,
  archivedPeopleByBoard,
  activeBoardView,
  automationRulesByBoard,
  archivedAutomationsByBoard,
  reminderRulesByBoard,
  defaultReminderRules,
  templatesByBoard,
  archivedTemplatesByBoard,
  boardPermissionsByBoard,
  roleOptions,
  defaultBoardPermissions,
  authUser,
  profilesById,
  boardMembershipsByBoard,
  notificationChannelsByBoard,
  boardInvitesByBoard,
  baseColumns,
}) {
  const selectedBoard = useMemo(
    () => boards.find((board) => board.id === selectedBoardId) || null,
    [boards, selectedBoardId],
  );

  const boardGroups = useMemo(
    () => groups.filter((group) => group.board_id === selectedBoardId).sort((a, b) => (a.position || 0) - (b.position || 0)),
    [groups, selectedBoardId],
  );

  const boardColumns = useMemo(
    () => customColumns
      .filter((column) => column.boardId === selectedBoardId)
      .sort((left, right) => (left.position || 0) - (right.position || 0) || left.name.localeCompare(right.name)),
    [customColumns, selectedBoardId],
  );

  const allColumns = useMemo(() => {
    const custom = boardColumns.map((column) => ({
      ...column,
      label: column.name,
      defaultWidth: 180,
      isCustom: true,
    }));

    const fallbackOrder = [...baseColumns.map((column) => column.id), ...custom.map((column) => column.id)];
    const normalizedOrder = [
      ...columnOrder.filter((id) => fallbackOrder.includes(id)),
      ...fallbackOrder.filter((id) => !columnOrder.includes(id)),
    ];

    return normalizedOrder
      .map((id) => baseColumns.find((column) => column.id === id) || custom.find((column) => column.id === id))
      .filter(Boolean);
  }, [baseColumns, boardColumns, columnOrder]);

  const visibleColumns = useMemo(
    () => allColumns.filter((column) => !hiddenColumnIds.includes(column.id)),
    [allColumns, hiddenColumnIds],
  );

  const boardSavedViews = useMemo(
    () => savedViews.filter((view) => view.boardId === selectedBoardId),
    [savedViews, selectedBoardId],
  );

  const currentBoardViews = useMemo(
    () => normalizeWorkspaceViews(workspaceViewsByBoard[selectedBoardId] || defaultWorkspaceViews),
    [defaultWorkspaceViews, normalizeWorkspaceViews, selectedBoardId, workspaceViewsByBoard],
  );

  const archivedCurrentWorkspaceViews = useMemo(
    () => archivedWorkspaceViewsByBoard[selectedBoardId] || [],
    [archivedWorkspaceViewsByBoard, selectedBoardId],
  );

  const archivedCurrentSavedViews = useMemo(
    () => archivedSavedViewsByBoard[selectedBoardId] || [],
    [archivedSavedViewsByBoard, selectedBoardId],
  );

  const archivedCurrentGroups = useMemo(
    () => archivedGroupsByBoard[selectedBoardId] || [],
    [archivedGroupsByBoard, selectedBoardId],
  );

  const archivedCurrentPeople = useMemo(
    () => archivedPeopleByBoard[selectedBoardId] || [],
    [archivedPeopleByBoard, selectedBoardId],
  );

  const currentWorkspaceView = useMemo(
    () => currentBoardViews.find((view) => view.id === activeBoardView) || currentBoardViews[0] || defaultWorkspaceViews[0],
    [activeBoardView, currentBoardViews, defaultWorkspaceViews],
  );

  const boardAutomations = useMemo(
    () => automationRulesByBoard[selectedBoardId] || [],
    [automationRulesByBoard, selectedBoardId],
  );

  const archivedCurrentAutomations = useMemo(
    () => archivedAutomationsByBoard[selectedBoardId] || [],
    [archivedAutomationsByBoard, selectedBoardId],
  );

  const boardReminderRules = useMemo(
    () => ({ ...defaultReminderRules, ...(reminderRulesByBoard[selectedBoardId] || {}) }),
    [defaultReminderRules, reminderRulesByBoard, selectedBoardId],
  );

  const boardTemplates = useMemo(
    () => templatesByBoard[selectedBoardId] || [],
    [selectedBoardId, templatesByBoard],
  );

  const archivedCurrentTemplates = useMemo(
    () => archivedTemplatesByBoard[selectedBoardId] || [],
    [archivedTemplatesByBoard, selectedBoardId],
  );

  const boardPermissions = useMemo(() => {
    const existingPermissions = boardPermissionsByBoard[selectedBoardId] || [];
    return roleOptions.map((roleName, index) => {
      const matchingPermission = existingPermissions.find((permission) => permission.role_name === roleName);
      if (matchingPermission) return matchingPermission;
      const defaultPermission = defaultBoardPermissions.find((permission) => permission.role_name === roleName) || defaultBoardPermissions[index];
      return {
        id: `local-permission-${selectedBoardId || 'board'}-${roleName}`,
        ...defaultPermission,
      };
    });
  }, [boardPermissionsByBoard, defaultBoardPermissions, roleOptions, selectedBoardId]);

  const currentProfile = useMemo(
    () => (authUser ? profilesById[authUser.id] || null : null),
    [authUser, profilesById],
  );

  const knownProfiles = useMemo(
    () => Object.values(profilesById).sort((left, right) => {
      const leftLabel = left.full_name || left.email || left.id;
      const rightLabel = right.full_name || right.email || right.id;
      return leftLabel.localeCompare(rightLabel);
    }),
    [profilesById],
  );

  const currentBoardMembership = useMemo(
    () => (authUser && selectedBoardId
      ? (boardMembershipsByBoard[selectedBoardId] || []).find((membership) => membership.user_id === authUser.id) || null
      : null),
    [authUser, boardMembershipsByBoard, selectedBoardId],
  );

  const boardNotificationChannels = useMemo(
    () => notificationChannelsByBoard[selectedBoardId] || [],
    [notificationChannelsByBoard, selectedBoardId],
  );

  const boardMemberships = useMemo(
    () => boardMembershipsByBoard[selectedBoardId] || [],
    [boardMembershipsByBoard, selectedBoardId],
  );

  const availableMembershipProfiles = useMemo(
    () => knownProfiles.filter((profile) => !boardMemberships.some((membership) => membership.user_id === profile.id)),
    [boardMemberships, knownProfiles],
  );

  const boardInvites = useMemo(
    () => boardInvitesByBoard[selectedBoardId] || [],
    [boardInvitesByBoard, selectedBoardId],
  );

  return {
    selectedBoard,
    boardGroups,
    boardColumns,
    allColumns,
    visibleColumns,
    boardSavedViews,
    currentBoardViews,
    archivedCurrentWorkspaceViews,
    archivedCurrentSavedViews,
    archivedCurrentGroups,
    archivedCurrentPeople,
    currentWorkspaceView,
    boardAutomations,
    archivedCurrentAutomations,
    boardReminderRules,
    boardTemplates,
    archivedCurrentTemplates,
    boardPermissions,
    currentProfile,
    knownProfiles,
    currentBoardMembership,
    boardNotificationChannels,
    boardMemberships,
    availableMembershipProfiles,
    boardInvites,
  };
}
