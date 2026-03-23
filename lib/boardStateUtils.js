export function makeDefaultBoardGroups() {
  return [
    { name: 'Assigned', ui_class: 'assigned', position: 1 },
    { name: 'Survey Done', ui_class: 'survey', position: 2 },
    { name: 'QA', ui_class: 'qa', position: 3 },
    { name: 'Submitted', ui_class: 'submitted', position: 4 },
  ];
}

export function makeDefaultBoardPermissions() {
  return [
    { role_name: 'Admin', can_manage_structure: true, can_edit_deals: true, can_delete_deals: true },
    { role_name: 'Manager', can_manage_structure: true, can_edit_deals: true, can_delete_deals: true },
    { role_name: 'QA', can_manage_structure: false, can_edit_deals: true, can_delete_deals: false },
    { role_name: 'Assessor', can_manage_structure: false, can_edit_deals: true, can_delete_deals: false },
    { role_name: 'Viewer', can_manage_structure: false, can_edit_deals: false, can_delete_deals: false },
  ];
}

export function withoutBoardKey(previousMap, boardId) {
  const next = { ...previousMap };
  delete next[boardId];
  return next;
}

export function removeBoardScopedItems(items, boardId, key = 'boardId') {
  return items.filter((item) => item[key] !== boardId);
}

export function removeBoardScopedPeople(items, boardId) {
  return items.filter((item) => (item.boardId || boardId) !== boardId);
}

export function removeBoardTasks(tasks, groups, boardId) {
  const groupIds = new Set(groups.filter((group) => group.board_id === boardId).map((group) => group.id));
  return tasks.filter((task) => !groupIds.has(task.group_id));
}

export function sortByPosition(items) {
  return [...items].sort((left, right) => (left.position || 0) - (right.position || 0));
}

export function appendBoardMapItem(previousMap, boardId, item) {
  return {
    ...previousMap,
    [boardId]: [...(previousMap[boardId] || []), item],
  };
}

export function prependBoardMapItem(previousMap, boardId, item) {
  return {
    ...previousMap,
    [boardId]: [item, ...(previousMap[boardId] || [])],
  };
}

export function archiveBoardMapItem(previousMap, boardId, item, archivedAt) {
  return appendBoardMapItem(
    removeBoardMapItem(previousMap, boardId, item.id),
    boardId,
    { ...item, archived_at: archivedAt },
  );
}

export function removeBoardMapItem(previousMap, boardId, itemId) {
  return {
    ...previousMap,
    [boardId]: (previousMap[boardId] || []).filter((item) => item.id !== itemId),
  };
}

export function filterBoardMapItems(previousMap, boardId, predicate) {
  return {
    ...previousMap,
    [boardId]: (previousMap[boardId] || []).filter(predicate),
  };
}

export function replaceBoardMapItem(previousMap, boardId, itemId, updater) {
  return {
    ...previousMap,
    [boardId]: (previousMap[boardId] || []).map((item) => (
      item.id === itemId ? updater(item) : item
    )),
  };
}

export function upsertBoardMapItem(previousMap, boardId, item) {
  return {
    ...previousMap,
    [boardId]: appendUniqueById(previousMap[boardId] || [], item),
  };
}

export function appendUniqueById(items, item) {
  return [...items.filter((current) => current.id !== item.id), item];
}

export function removeById(items, itemId) {
  return items.filter((item) => item.id !== itemId);
}
