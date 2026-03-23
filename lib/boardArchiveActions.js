import {
  appendUniqueById,
  archiveBoardMapItem,
  removeBoardMapItem,
  removeById,
  removeBoardScopedItems,
  removeBoardScopedPeople,
  removeBoardTasks,
  sortByPosition,
  withoutBoardKey,
} from './boardStateUtils';

export function createBoardArchiveActions(deps) {
  const {
    canEditBoardStructure,
    canEditDeals,
    canDeleteDeals,
    selectedBoardId,
    boards,
    groups,
    tasks,
    selectedTask,
    workspaceViewsByBoard,
    archivedBoards,
    archivedCurrentWorkspaceViews,
    archivedCurrentSavedViews,
    archivedCurrentGroups,
    archivedCurrentPeople,
    activeBoardView,
    usingDemoMode,
    supabase,
    loadData,
    persistTask,
    deleteGroupPermanently,
    setErrorText,
    setBoards,
    setArchivedBoards,
    setSelectedBoardId,
    setGroups,
    setTasks,
    setCustomColumns,
    setSavedViews,
    setAssessors,
    setNotifications,
    setTemplatesByBoard,
    setArchivedTemplatesByBoard,
    setAutomationRulesByBoard,
    setArchivedAutomationsByBoard,
    setBoardMembershipsByBoard,
    setBoardInvitesByBoard,
    setWorkspaceViewsByBoard,
    setArchivedWorkspaceViewsByBoard,
    setArchivedSavedViewsByBoard,
    setBoardPermissionsByBoard,
    setArchivedPeopleByBoard,
    setArchivedGroupsByBoard,
    setActiveBoardView,
    setPendingWorkspaceViewArchiveId,
    setPendingWorkspaceViewDeleteId,
    setPendingAssessorArchiveId,
    setPendingAssessorDeleteId,
    normalizeWorkspaceViews,
    DEFAULT_WORKSPACE_VIEWS,
  } = deps;

  function clearDeletedBoardState(boardId, remainingBoards) {
    setBoards(remainingBoards);
    setGroups((prev) => prev.filter((group) => group.board_id !== boardId));
    setTasks((prev) => removeBoardTasks(prev, groups, boardId));
    setCustomColumns((prev) => removeBoardScopedItems(prev, boardId));
    setSavedViews((prev) => removeBoardScopedItems(prev, boardId));
    setAssessors((prev) => removeBoardScopedPeople(prev, boardId));
    setNotifications((prev) => removeBoardScopedItems(prev, boardId));
    setSelectedBoardId(remainingBoards[0]?.id || null);
    setTemplatesByBoard((prev) => withoutBoardKey(prev, boardId));
    setArchivedTemplatesByBoard((prev) => withoutBoardKey(prev, boardId));
    setAutomationRulesByBoard((prev) => withoutBoardKey(prev, boardId));
    setArchivedAutomationsByBoard((prev) => withoutBoardKey(prev, boardId));
    setBoardMembershipsByBoard((prev) => withoutBoardKey(prev, boardId));
    setBoardInvitesByBoard((prev) => withoutBoardKey(prev, boardId));
    setWorkspaceViewsByBoard((prev) => withoutBoardKey(prev, boardId));
    setArchivedWorkspaceViewsByBoard((prev) => withoutBoardKey(prev, boardId));
    setArchivedSavedViewsByBoard((prev) => withoutBoardKey(prev, boardId));
    setBoardPermissionsByBoard((prev) => withoutBoardKey(prev, boardId));
    setArchivedPeopleByBoard((prev) => withoutBoardKey(prev, boardId));
    setArchivedGroupsByBoard((prev) => withoutBoardKey(prev, boardId));
  }

  async function deleteWorkspaceViewPermanently(viewId) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;

    const currentViews = normalizeWorkspaceViews(workspaceViewsByBoard[selectedBoardId] || DEFAULT_WORKSPACE_VIEWS);
    const targetView = currentViews.find((view) => view.id === viewId) || archivedCurrentWorkspaceViews.find((view) => view.id === viewId);
    if (!targetView) return;
    if (currentViews.some((view) => view.id === viewId) && currentViews.length <= 1) {
      setErrorText('Keep at least one active view on the board.');
      return;
    }

    setWorkspaceViewsByBoard((prev) => ({
      ...prev,
      [selectedBoardId]: normalizeWorkspaceViews((prev[selectedBoardId] || DEFAULT_WORKSPACE_VIEWS).filter((view) => view.id !== viewId)),
    }));
    setArchivedWorkspaceViewsByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, viewId));
    if (activeBoardView === viewId) {
      setActiveBoardView(currentViews.filter((view) => view.id !== viewId)[0]?.id || 'main');
    }
    setPendingWorkspaceViewArchiveId(null);
    setPendingWorkspaceViewDeleteId(null);

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('workspace_views').delete().eq('id', viewId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function restoreWorkspaceView(viewId) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    const archivedView = archivedCurrentWorkspaceViews.find((view) => view.id === viewId);
    if (!archivedView) return;

    setArchivedWorkspaceViewsByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, viewId));
    setWorkspaceViewsByBoard((prev) => ({
      ...prev,
      [selectedBoardId]: normalizeWorkspaceViews(
        appendUniqueById(prev[selectedBoardId] || DEFAULT_WORKSPACE_VIEWS, { ...archivedView, archived_at: null }),
      ),
    }));

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('workspace_views').update({ archived_at: null }).eq('id', viewId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function restoreSavedView(viewId) {
    if (!canEditDeals()) return;
    if (!selectedBoardId) return;
    const archivedView = archivedCurrentSavedViews.find((view) => view.id === viewId);
    if (!archivedView) return;

    setArchivedSavedViewsByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, viewId));
    setSavedViews((prev) => appendUniqueById(prev, { ...archivedView, archived_at: null }));

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('board_views').update({ archived_at: null }).eq('id', viewId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function deleteArchivedSavedView(viewId) {
    if (!canEditDeals()) return;
    if (!selectedBoardId) return;

    setArchivedSavedViewsByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, viewId));
    setSavedViews((prev) => removeById(prev, viewId));

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('board_views').delete().eq('id', viewId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function restoreGroup(groupId) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    const archivedGroup = archivedCurrentGroups.find((group) => group.id === groupId);
    if (!archivedGroup) return;

    setArchivedGroupsByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, groupId));
    setGroups((prev) => sortByPosition(appendUniqueById(prev, { ...archivedGroup, archived_at: null })));

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('groups').update({ archived_at: null }).eq('id', groupId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function deleteArchivedGroup(groupId) {
    await deleteGroupPermanently(groupId);
  }

  async function restorePerson(personId) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    const archivedPerson = archivedCurrentPeople.find((person) => person.id === personId);
    if (!archivedPerson) return;

    setArchivedPeopleByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, personId));
    setAssessors((prev) => appendUniqueById(prev, { ...archivedPerson, archived_at: null }));

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('board_people').update({ archived_at: null }).eq('id', personId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function deleteArchivedPerson(personId) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;

    setArchivedPeopleByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, personId));
    setPendingAssessorArchiveId(null);
    setPendingAssessorDeleteId(null);

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('board_people').delete().eq('id', personId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function restoreTask(taskId) {
    if (!canDeleteDeals()) return;
    setTasks((prev) => prev.map((task) => (
      task.id === taskId ? { ...task, archived_at: null } : task
    )));
    if (usingDemoMode || !supabase) return;
    const ok = await persistTask(taskId, { archived_at: null });
    if (!ok) await loadData();
  }

  async function archiveSelectedBoard() {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    const boardToArchive = boards.find((board) => board.id === selectedBoardId);
    if (!boardToArchive) return;
    const archivedAt = new Date().toISOString();
    const remainingBoards = boards.filter((board) => board.id !== selectedBoardId);

    setBoards(remainingBoards);
    setArchivedBoards((prev) => [...prev, { ...boardToArchive, archived_at: archivedAt }]);
    setSelectedBoardId(remainingBoards[0]?.id || null);

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('boards').update({ archived_at: archivedAt }).eq('id', selectedBoardId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function restoreBoard(boardId) {
    if (!canEditBoardStructure()) return;
    const archivedBoard = archivedBoards.find((board) => board.id === boardId);
    if (!archivedBoard) return;

    setArchivedBoards((prev) => prev.filter((board) => board.id !== boardId));
    setBoards((prev) => sortByPosition([...prev, { ...archivedBoard, archived_at: null }]));
    if (!selectedBoardId) setSelectedBoardId(boardId);

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('boards').update({ archived_at: null }).eq('id', boardId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function deleteSelectedBoard() {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;

    const boardId = selectedBoardId;
    const remainingBoards = boards.filter((board) => board.id !== boardId);
    clearDeletedBoardState(boardId, remainingBoards);

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('boards').delete().eq('id', boardId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  return {
    archiveSelectedBoard,
    restoreBoard,
    deleteSelectedBoard,
    restoreTask,
    restorePerson,
    deleteArchivedPerson,
    restoreGroup,
    deleteArchivedGroup,
    restoreSavedView,
    deleteArchivedSavedView,
    restoreWorkspaceView,
    deleteWorkspaceViewPermanently,
    clearDeletedBoardState,
  };
}
