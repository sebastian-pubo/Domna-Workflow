import {
  appendUniqueById,
  archiveBoardMapItem,
  filterBoardMapItems,
  removeById,
  removeBoardMapItem,
} from './boardStateUtils';

export function createBoardPeopleViewActions(deps) {
  const {
    canEditBoardStructure,
    canEditDeals,
    selectedBoardId,
    selectedViewId,
    selectedBoard,
    search,
    assessorFilter,
    priorityFilter,
    qaFilter,
    boardSavedViews,
    workspaceViewsByBoard,
    archivedCurrentPeople,
    assessors,
    tasks,
    usingDemoMode,
    supabase,
    loadData,
    persistTask,
    setErrorText,
    setSavedViews,
    setSelectedViewId,
    setWorkspaceViewsByBoard,
    setActiveBoardView,
    setNewWorkspaceViewName,
    setNewWorkspaceViewType,
    setArchivedWorkspaceViewsByBoard,
    setPendingWorkspaceViewArchiveId,
    setPendingWorkspaceViewDeleteId,
    setAssessors,
    setArchivedPeopleByBoard,
    setAssessorDraftName,
    setAssessorDraftRole,
    setTasks,
    setSelectedTask,
    setPendingAssessorArchiveId,
    setPendingAssessorDeleteId,
    normalizeWorkspaceViews,
    DEFAULT_WORKSPACE_VIEWS,
    makeAssessorId,
  } = deps;

  function buildViewPayload(name) {
    return {
      name,
      boardId: selectedBoardId,
      search: search.trim(),
      assessorFilter,
      priorityFilter,
      qaFilter,
    };
  }

  function applySavedView(view, setters) {
    setters.setSelectedBoardId(view.boardId);
    setters.setSearch(view.search || '');
    setters.setAssessorFilter(view.assessorFilter || 'All');
    setters.setPriorityFilter(view.priorityFilter || 'All');
    setters.setQaFilter(view.qaFilter || 'All');
    setters.setSelectedViewId(view.id);
  }

  async function saveCurrentView(viewDraftName) {
    if (!canEditDeals()) return;
    const name = viewDraftName.trim();
    if (!name || !selectedBoardId) return null;

    const payload = buildViewPayload(name);

    if (usingDemoMode || !supabase) {
      const localView = {
        id: `view-${Date.now()}`,
        ...payload,
      };
      setSavedViews((prev) => [...prev.filter((view) => !(view.boardId === selectedBoardId && view.name.toLowerCase() === name.toLowerCase())), localView]);
      setSelectedViewId(localView.id);
      return { ok: true, resetDraft: true };
    }

    const existingView = boardSavedViews.find((view) => view.name.toLowerCase() === name.toLowerCase());
    const query = existingView
      ? supabase.from('board_views').update({
        name,
        search_text: payload.search,
        assessor_filter: payload.assessorFilter,
        priority_filter: payload.priorityFilter,
        qa_filter: payload.qaFilter,
      }).eq('id', existingView.id).select().single()
      : supabase.from('board_views').insert({
        board_id: payload.boardId,
        name,
        search_text: payload.search,
        assessor_filter: payload.assessorFilter,
        priority_filter: payload.priorityFilter,
        qa_filter: payload.qaFilter,
      }).select().single();

    const { data, error } = await query;
    if (error) {
      setErrorText(error.message);
      return { ok: false };
    }

    const nextView = {
      id: data.id,
      boardId: data.board_id,
      name: data.name,
      search: data.search_text || '',
      assessorFilter: data.assessor_filter || 'All',
      priorityFilter: data.priority_filter || 'All',
      qaFilter: data.qa_filter || 'All',
    };

    setSavedViews((prev) => [...prev.filter((view) => view.id !== nextView.id), nextView]);
    setSelectedViewId(nextView.id);
    return { ok: true, resetDraft: true };
  }

  async function addWorkspaceView(newWorkspaceViewName, newWorkspaceViewType) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;

    const name = newWorkspaceViewName.trim() || `${newWorkspaceViewType === 'main' ? 'Table' : newWorkspaceViewType.charAt(0).toUpperCase() + newWorkspaceViewType.slice(1)} view`;
    const nextPosition = normalizeWorkspaceViews(workspaceViewsByBoard[selectedBoardId] || DEFAULT_WORKSPACE_VIEWS).length + 1;
    const nextView = {
      id: `workspace-view-${Date.now()}`,
      type: newWorkspaceViewType,
      name,
      locked: false,
      position: nextPosition,
    };

    setWorkspaceViewsByBoard((prev) => ({
      ...prev,
      [selectedBoardId]: [...normalizeWorkspaceViews(prev[selectedBoardId] || DEFAULT_WORKSPACE_VIEWS), nextView],
    }));
    setActiveBoardView(nextView.id);
    setNewWorkspaceViewName('');
    setNewWorkspaceViewType('main');

    if (usingDemoMode || !supabase) return;

    const { data, error } = await supabase
      .from('workspace_views')
      .insert({
        board_id: selectedBoardId,
        name,
        view_type: newWorkspaceViewType,
        position: nextPosition,
        locked: false,
      })
      .select()
      .single();

    if (error) {
      setErrorText(error.message);
      await loadData();
      return;
    }

    const persistedView = {
      id: data.id,
      type: data.view_type || 'main',
      name: data.name,
      locked: Boolean(data.locked),
      position: data.position || nextPosition,
    };

    setWorkspaceViewsByBoard((prev) => ({
      ...prev,
      [selectedBoardId]: [
        ...normalizeWorkspaceViews(prev[selectedBoardId] || DEFAULT_WORKSPACE_VIEWS).filter((view) => view.id !== nextView.id),
        persistedView,
      ],
    }));
    setActiveBoardView(data.id);
  }

  async function renameWorkspaceView(viewId, name) {
    if (!canEditBoardStructure()) return;
    const nextName = name.trim();
    if (!selectedBoardId || !nextName) return;

    setWorkspaceViewsByBoard((prev) => ({
      ...prev,
      [selectedBoardId]: normalizeWorkspaceViews(prev[selectedBoardId] || DEFAULT_WORKSPACE_VIEWS).map((view) => (
        view.id === viewId ? { ...view, name: nextName } : view
      )),
    }));

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase.from('workspace_views').update({ name: nextName }).eq('id', viewId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function removeWorkspaceView(viewId, activeBoardView) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;

    const currentViews = normalizeWorkspaceViews(workspaceViewsByBoard[selectedBoardId] || DEFAULT_WORKSPACE_VIEWS);
    const targetView = currentViews.find((view) => view.id === viewId);
    if (!targetView) return;
    if (currentViews.length <= 1) {
      setErrorText('Keep at least one active view on the board.');
      return;
    }

    const archivedAt = new Date().toISOString();

    setWorkspaceViewsByBoard((prev) => {
      const current = normalizeWorkspaceViews(prev[selectedBoardId] || DEFAULT_WORKSPACE_VIEWS);
      const nextViews = current.filter((view) => view.id !== viewId);
      return {
        ...prev,
        [selectedBoardId]: nextViews.length ? nextViews : DEFAULT_WORKSPACE_VIEWS,
      };
    });
    setArchivedWorkspaceViewsByBoard((prev) => archiveBoardMapItem(prev, selectedBoardId, targetView, archivedAt));

    if (activeBoardView === viewId) {
      setActiveBoardView(currentViews.filter((view) => view.id !== viewId)[0]?.id || 'main');
    }
    setPendingWorkspaceViewArchiveId(null);
    setPendingWorkspaceViewDeleteId(null);

    if (usingDemoMode || !supabase) return;

    const { error } = await supabase
      .from('workspace_views')
      .update({ archived_at: archivedAt })
      .eq('id', viewId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function addAssessor(assessorDraftName, assessorDraftRole) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    const name = assessorDraftName.trim();
    if (!name) return;

    const nextPerson = {
      id: makeAssessorId(`${selectedBoardId}-${name}`),
      boardId: selectedBoardId,
      name,
      role: assessorDraftRole || 'Assessor',
    };

    setAssessors((prev) => {
      if (prev.some((assessor) => (assessor.boardId || selectedBoardId) === selectedBoardId && assessor.name.toLowerCase() === name.toLowerCase())) {
        return prev;
      }

      return [...prev, nextPerson];
    });
    setArchivedPeopleByBoard((prev) => filterBoardMapItems(
      prev,
      selectedBoardId,
      (person) => person.name.toLowerCase() !== name.toLowerCase(),
    ));

    setAssessorDraftName('');
    setAssessorDraftRole('Assessor');

    if (usingDemoMode || !supabase) return;

    const { data, error } = await supabase
      .from('board_people')
      .upsert({
        board_id: selectedBoardId,
        name,
        role: assessorDraftRole || 'Assessor',
        archived_at: null,
      }, { onConflict: 'board_id,name' })
      .select()
      .single();

    if (error) {
      setErrorText(error.message);
      await loadData();
      return;
    }

    setAssessors((prev) => {
      const next = prev.filter((person) => !(person.boardId === selectedBoardId && person.name.toLowerCase() === name.toLowerCase()));
      return [...next, {
        id: data.id,
        boardId: data.board_id,
        name: data.name,
        role: data.role || 'Assessor',
      }];
    });
  }

  async function removeAssessor(assessorName) {
    if (!canEditBoardStructure()) return;
    if (assessorName === 'Unassigned') return;
    const archivedAt = new Date().toISOString();
    const archivedPerson = assessors.find((assessor) => (assessor.boardId || selectedBoardId) === selectedBoardId && assessor.name === assessorName);
    setAssessors((prev) => prev.filter((assessor) => !((assessor.boardId || selectedBoardId) === selectedBoardId && assessor.name === assessorName)));
    if (archivedPerson) {
      setArchivedPeopleByBoard((prev) => archiveBoardMapItem(prev, selectedBoardId, archivedPerson, archivedAt));
    }
    setTasks((prev) => prev.map((task) => (task.assessor === assessorName ? { ...task, assessor: 'Unassigned' } : task)));
    setSelectedTask((prev) => (prev && prev.assessor === assessorName ? { ...prev, assessor: 'Unassigned' } : prev));

    if (usingDemoMode || !supabase) return;

    const { error: personError } = await supabase
      .from('board_people')
      .update({ archived_at: archivedAt })
      .eq('board_id', selectedBoardId)
      .eq('name', assessorName);
    if (personError) {
      setErrorText(personError.message);
      await loadData();
      return;
    }

    const affectedTasks = tasks.filter((task) => task.assessor === assessorName).map((task) => task.id);
    await Promise.all(affectedTasks.map((taskId) => persistTask(taskId, { assessor: 'Unassigned' })));
    setPendingAssessorArchiveId(null);
    setPendingAssessorDeleteId(null);
  }

  async function deleteAssessorPermanently(assessorId, assessorName) {
    if (!canEditBoardStructure()) return;
    if (assessorName === 'Unassigned') return;

    setAssessors((prev) => prev.filter((assessor) => assessor.id !== assessorId));
    setArchivedPeopleByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, assessorId));
    setTasks((prev) => prev.map((task) => (task.assessor === assessorName ? { ...task, assessor: 'Unassigned' } : task)));
    setSelectedTask((prev) => (prev && prev.assessor === assessorName ? { ...prev, assessor: 'Unassigned' } : prev));
    setPendingAssessorArchiveId(null);
    setPendingAssessorDeleteId(null);

    if (usingDemoMode || !supabase) return;

    const { error: personError } = await supabase.from('board_people').delete().eq('id', assessorId);
    if (personError) {
      setErrorText(personError.message);
      await loadData();
      return;
    }

    const affectedTasks = tasks.filter((task) => task.assessor === assessorName).map((task) => task.id);
    await Promise.all(affectedTasks.map((taskId) => persistTask(taskId, { assessor: 'Unassigned' })));
  }

  async function deleteSavedView(viewId) {
    if (!canEditDeals()) return;
    const archivedAt = new Date().toISOString();
    if (usingDemoMode || !supabase) {
      setSavedViews((prev) => removeById(prev, viewId));
      const archivedView = boardSavedViews.find((view) => view.id === viewId);
      if (archivedView && selectedBoardId) {
        setArchivedSavedViewsByBoard((prev) => archiveBoardMapItem(prev, selectedBoardId, archivedView, archivedAt));
      }
      if (selectedViewId === viewId) setSelectedViewId(null);
      return;
    }

    const { error } = await supabase.from('board_views').update({ archived_at: archivedAt }).eq('id', viewId);
    if (error) {
      setErrorText(error.message);
      return;
    }

    const archivedView = boardSavedViews.find((view) => view.id === viewId);
    setSavedViews((prev) => removeById(prev, viewId));
    if (archivedView && selectedBoardId) {
      setArchivedSavedViewsByBoard((prev) => archiveBoardMapItem(prev, selectedBoardId, archivedView, archivedAt));
    }
    if (selectedViewId === viewId) setSelectedViewId(null);
  }

  return {
    buildViewPayload,
    applySavedView,
    saveCurrentView,
    addWorkspaceView,
    renameWorkspaceView,
    removeWorkspaceView,
    addAssessor,
    removeAssessor,
    deleteAssessorPermanently,
    deleteSavedView,
  };
}
