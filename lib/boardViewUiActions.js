export function createBoardViewUiActions(deps) {
  const {
    peopleViewActions,
    newWorkspaceViewName,
    newWorkspaceViewType,
    activeBoardView,
    viewDraftName,
    setViewDraftName,
    assessorDraftName,
    assessorDraftRole,
  } = deps;

  async function addWorkspaceView() {
    await peopleViewActions.addWorkspaceView(newWorkspaceViewName, newWorkspaceViewType);
  }

  async function renameWorkspaceView(viewId, name) {
    await peopleViewActions.renameWorkspaceView(viewId, name);
  }

  async function removeWorkspaceView(viewId) {
    await peopleViewActions.removeWorkspaceView(viewId, activeBoardView);
  }

  async function saveCurrentView() {
    const result = await peopleViewActions.saveCurrentView(viewDraftName);
    if (result?.resetDraft) {
      setViewDraftName('');
    }
  }

  async function addAssessor() {
    await peopleViewActions.addAssessor(assessorDraftName, assessorDraftRole);
  }

  async function removeAssessor(assessorName) {
    await peopleViewActions.removeAssessor(assessorName);
  }

  async function deleteAssessorPermanently(assessorId, assessorName) {
    await peopleViewActions.deleteAssessorPermanently(assessorId, assessorName);
  }

  async function deleteSavedView(viewId) {
    await peopleViewActions.deleteSavedView(viewId);
  }

  return {
    addWorkspaceView,
    renameWorkspaceView,
    removeWorkspaceView,
    saveCurrentView,
    addAssessor,
    removeAssessor,
    deleteAssessorPermanently,
    deleteSavedView,
  };
}
