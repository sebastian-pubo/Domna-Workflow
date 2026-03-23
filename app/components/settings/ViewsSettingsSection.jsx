'use client';

export default function ViewsSettingsSection({
  newWorkspaceViewName,
  setNewWorkspaceViewName,
  newWorkspaceViewType,
  setNewWorkspaceViewType,
  addWorkspaceView,
  canEditBoardStructure,
  currentBoardViews,
  pendingWorkspaceViewArchiveId,
  setPendingWorkspaceViewArchiveId,
  pendingWorkspaceViewDeleteId,
  setPendingWorkspaceViewDeleteId,
  renameWorkspaceView,
  removeWorkspaceView,
  deleteWorkspaceViewPermanently,
}) {
  return (
    <section className="settingsSection">
      <div className="panelTitle panelTitleSmall">Views</div>
      <div className="directoryForm">
        <input
          className="input"
          value={newWorkspaceViewName}
          onChange={(event) => setNewWorkspaceViewName(event.target.value)}
          placeholder="New view name"
        />
        <select className="select" value={newWorkspaceViewType} onChange={(event) => setNewWorkspaceViewType(event.target.value)}>
          <option value="main">Main table</option>
          <option value="kanban">Kanban</option>
          <option value="files">Files</option>
          <option value="dashboard">Dashboard</option>
          <option value="calendar">Calendar</option>
          <option value="timeline">Timeline</option>
        </select>
        <button className="btn" onClick={addWorkspaceView} disabled={!canEditBoardStructure()}>
          Add view
        </button>
      </div>
      <div className="directoryList">
        {currentBoardViews.map((view) => (
          <div className="directoryCard" key={view.id}>
            <div className="viewRenameRow">
              <input
                className="groupNameInput"
                defaultValue={view.name}
                onBlur={(event) => renameWorkspaceView(view.id, event.target.value)}
              />
              <div className="scoreMeta">{view.type}</div>
            </div>
            {pendingWorkspaceViewArchiveId === view.id ? (
              <div className="columnCardActions">
                <button className="btn btnDanger" onClick={() => removeWorkspaceView(view.id)}>
                  Archive
                </button>
                <button className="btn" onClick={() => setPendingWorkspaceViewArchiveId(null)}>
                  Cancel
                </button>
              </div>
            ) : pendingWorkspaceViewDeleteId === view.id ? (
              <div className="columnCardActions">
                <button className="btn btnDanger" onClick={() => deleteWorkspaceViewPermanently(view.id)}>
                  Delete
                </button>
                <button className="btn" onClick={() => setPendingWorkspaceViewDeleteId(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <div className="columnCardActions">
                <button className="textButton" onClick={() => {
                  setPendingWorkspaceViewDeleteId(null);
                  setPendingWorkspaceViewArchiveId(view.id);
                }}>
                  Archive
                </button>
                <button className="textButton" onClick={() => {
                  setPendingWorkspaceViewArchiveId(null);
                  setPendingWorkspaceViewDeleteId(view.id);
                }}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
