'use client';

export default function SidebarNav({
  boards,
  selectedBoardId,
  setSelectedBoardId,
  newBoardName,
  setNewBoardName,
  createBoard,
  canEditBoardStructure,
  currentBoardViews,
  activeBoardView,
  setActiveBoardView,
  showNotifications,
  setShowNotifications,
  showSettingsPanel,
  setShowSettingsPanel,
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brandLogo" src="/domna-logo-blue.svg" alt="Domna logo" />
      </div>

      <section className="sidePanel">
        <div className="sidePanelTitle">Boards</div>
        <div className="directoryForm">
          <input
            className="input"
            value={newBoardName}
            onChange={(event) => setNewBoardName(event.target.value)}
            placeholder="Create new board"
          />
          <button className="btn" onClick={createBoard} disabled={!canEditBoardStructure()}>
            Add board
          </button>
        </div>
        <div className="boardList">
          {boards.map((board) => (
            <button
              key={board.id}
              className={`boardButton ${board.id === selectedBoardId ? 'active' : ''}`}
              onClick={() => setSelectedBoardId(board.id)}
            >
              {board.name}
            </button>
          ))}
        </div>
      </section>

      <section className="sidePanel">
        <div className="sidePanelTitle">Workspace</div>
        <div className="boardList">
          {currentBoardViews.map((view) => (
            <button
              key={`side-view-${view.id}`}
              className={`boardButton ${activeBoardView === view.id ? 'active' : ''}`}
              onClick={() => setActiveBoardView(view.id)}
            >
              {view.name}
            </button>
          ))}
          <button
            className={`boardButton ${showNotifications ? 'active' : ''}`}
            onClick={() => setShowNotifications((prev) => !prev)}
          >
            Notifications
          </button>
          <button
            className={`boardButton ${showSettingsPanel ? 'active' : ''}`}
            onClick={() => setShowSettingsPanel((prev) => !prev)}
          >
            Settings
          </button>
        </div>
      </section>
    </aside>
  );
}
