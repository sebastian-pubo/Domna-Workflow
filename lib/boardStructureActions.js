import {
  archiveBoardMapItem,
  makeDefaultBoardGroups,
  makeDefaultBoardPermissions,
  removeBoardMapItem,
} from './boardStateUtils';

function inferGroupUiClass(name) {
  const normalizedName = String(name || '').toLowerCase();
  if (normalizedName.includes('qa')) return 'qa';
  if (normalizedName.includes('submit')) return 'submitted';
  if (normalizedName.includes('survey')) return 'survey';
  return 'assigned';
}

export function createBoardStructureActions(deps) {
  const {
    canEditBoardStructure,
    selectedBoardId,
    boardGroups,
    boardNameDraft,
    newBoardName,
    newGroupName,
    boards,
    groups,
    tasks,
    usingDemoMode,
    supabase,
    loadData,
    setErrorText,
    setBoards,
    setGroups,
    setWorkspaceViewsByBoard,
    setBoardPermissionsByBoard,
    setSelectedBoardId,
    setBoardNameDraft,
    setNewBoardName,
    setNewGroupName,
    setArchivedGroupsByBoard,
    setPendingGroupDeleteId,
    setPendingGroupPermanentDeleteId,
    DEFAULT_WORKSPACE_VIEWS,
  } = deps;

  async function createBoard() {
    if (!canEditBoardStructure()) return;
    const name = newBoardName.trim();
    if (!name) return;
    setErrorText('');

    const defaultGroups = makeDefaultBoardGroups();
    const defaultPermissions = makeDefaultBoardPermissions();

    if (usingDemoMode || !supabase) {
      const boardId = `board-${Date.now()}`;
      const nextBoard = { id: boardId, name, description: '', position: boards.length + 1 };
      setBoards((prev) => [...prev, nextBoard]);
      setGroups((prev) => [
        ...prev,
        ...defaultGroups.map((group) => ({ ...group, id: `${boardId}-${group.name}`, board_id: boardId })),
      ]);
      setBoardPermissionsByBoard((prev) => ({
        ...prev,
        [boardId]: defaultPermissions.map((permission, index) => ({
          id: `local-permission-${boardId}-${index}`,
          ...permission,
        })),
      }));
      setWorkspaceViewsByBoard((prev) => ({
        ...prev,
        [boardId]: DEFAULT_WORKSPACE_VIEWS,
      }));
      setSelectedBoardId(boardId);
      setNewBoardName('');
      return;
    }

    const { data: boardRow, error: boardError } = await supabase.from('boards').insert({
      name,
      description: '',
      position: boards.length + 1,
    }).select().single();

    if (boardError) {
      setErrorText(boardError.message);
      return;
    }

    const { error: groupError } = await supabase.from('groups').insert(
      defaultGroups.map((group) => ({
        board_id: boardRow.id,
        name: group.name,
        ui_class: group.ui_class,
        position: group.position,
      })),
    );

    if (groupError) {
      setErrorText(groupError.message);
      return;
    }

    const { error: workspaceViewError } = await supabase.from('workspace_views').insert(
      DEFAULT_WORKSPACE_VIEWS.map((view, index) => ({
        board_id: boardRow.id,
        name: view.name,
        view_type: view.type,
        position: index + 1,
        locked: Boolean(view.locked),
      })),
    );

    const { error: boardPermissionsError } = await supabase.from('board_permissions').insert(
      defaultPermissions.map((permission) => ({
        board_id: boardRow.id,
        ...permission,
      })),
    );

    setBoards((prev) => [...prev, boardRow]);
    setGroups((prev) => [
      ...prev,
      ...defaultGroups.map((group, index) => ({
        id: `${boardRow.id}-${group.name}-${index}`,
        board_id: boardRow.id,
        name: group.name,
        ui_class: group.ui_class,
        position: group.position,
      })),
    ]);
    setWorkspaceViewsByBoard((prev) => ({
      ...prev,
      [boardRow.id]: DEFAULT_WORKSPACE_VIEWS,
    }));
    setNewBoardName('');
    setSelectedBoardId(boardRow.id);
    setBoardNameDraft(boardRow.name);
    if (workspaceViewError || boardPermissionsError) {
      setErrorText(
        workspaceViewError?.message
          || boardPermissionsError?.message
          || 'Some advanced board settings could not be created, but the board itself was added.',
      );
    }
    await loadData();
  }

  async function renameSelectedBoard() {
    if (!canEditBoardStructure()) return;
    const name = boardNameDraft.trim();
    if (!selectedBoardId || !name) return;

    setBoards((prev) => prev.map((board) => (board.id === selectedBoardId ? { ...board, name } : board)));

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('boards').update({ name }).eq('id', selectedBoardId);
    if (error) setErrorText(error.message);
  }

  async function addGroup() {
    if (!canEditBoardStructure()) return;
    const name = newGroupName.trim();
    if (!name || !selectedBoardId) return;
    setErrorText('');

    const nextPosition = boardGroups.length + 1;
    const uiClass = inferGroupUiClass(name);

    if (usingDemoMode || !supabase) {
      setGroups((prev) => [...prev, {
        id: `group-${Date.now()}`,
        board_id: selectedBoardId,
        name,
        ui_class: uiClass,
        position: nextPosition,
      }]);
      setNewGroupName('');
      return;
    }

    const { data, error } = await supabase.from('groups').insert({
      board_id: selectedBoardId,
      name,
      ui_class: uiClass,
      position: nextPosition,
    }).select().single();

    if (error) {
      setErrorText(error.message);
      return;
    }

    setGroups((prev) => [...prev, data]);
    setNewGroupName('');
  }

  async function renameGroup(groupId, value) {
    if (!canEditBoardStructure()) return;
    const name = value.trim();
    if (!groupId || !name) return;

    setGroups((prev) => prev.map((group) => (group.id === groupId ? { ...group, name } : group)));

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('groups').update({ name }).eq('id', groupId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function removeGroup(groupId) {
    if (!canEditBoardStructure()) return;
    const groupTaskCount = tasks.filter((task) => task.group_id === groupId && !task.archived_at).length;
    if (groupTaskCount > 0) {
      setErrorText('Move or archive all active items in this group before archiving the stage.');
      return;
    }

    const archivedAt = new Date().toISOString();
    const targetGroup = groups.find((group) => group.id === groupId);

    if (usingDemoMode || !supabase) {
      setGroups((prev) => prev.filter((group) => group.id !== groupId));
      if (targetGroup) {
        setArchivedGroupsByBoard((prev) => archiveBoardMapItem(prev, targetGroup.board_id, targetGroup, archivedAt));
      }
      setPendingGroupDeleteId(null);
      return;
    }

    const { error } = await supabase.from('groups').update({ archived_at: archivedAt }).eq('id', groupId);
    if (error) {
      setErrorText(error.message);
      return;
    }

    setGroups((prev) => prev.filter((group) => group.id !== groupId));
    if (targetGroup) {
      setArchivedGroupsByBoard((prev) => archiveBoardMapItem(prev, targetGroup.board_id, targetGroup, archivedAt));
    }
    setPendingGroupDeleteId(null);
    setPendingGroupPermanentDeleteId(null);
  }

  async function deleteGroupPermanently(groupId) {
    if (!canEditBoardStructure()) return;
    const groupTaskCount = tasks.filter((task) => task.group_id === groupId).length;
    if (groupTaskCount > 0) {
      setErrorText('Archive or move all items in this stage before deleting it permanently.');
      return;
    }

    setGroups((prev) => prev.filter((group) => group.id !== groupId));
    setArchivedGroupsByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, groupId));
    setPendingGroupDeleteId(null);
    setPendingGroupPermanentDeleteId(null);

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('groups').delete().eq('id', groupId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  return {
    createBoard,
    renameSelectedBoard,
    addGroup,
    renameGroup,
    removeGroup,
    deleteGroupPermanently,
  };
}
