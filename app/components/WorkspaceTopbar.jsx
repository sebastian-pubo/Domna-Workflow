'use client';

export default function WorkspaceTopbar({
  selectedBoard,
  searchInputRef,
  search,
  setSearch,
  unreadNotificationsCount,
  setShowNotifications,
  activeRoleName,
  setShowSettingsPanel,
  showSettingsPanel,
  loadData,
}) {
  return (
    <div className="topbar">
      <div className="workspaceHeader">
        <div className="workspaceEyebrow">Domna workspace</div>
        <h1 className="pageTitle">{selectedBoard ? selectedBoard.name : 'Loading board...'}</h1>
        <div className="pageMeta">Track deals, people, files, reminders, and delivery from one shared board.</div>
      </div>

      <div className="actions">
        <div className="searchWrap">
          <input
            ref={searchInputRef}
            className="searchInput"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search homes, assessors, issues, notes, or comments..."
          />
        </div>
        <button className="btn notificationButton btnAccentWarm" onClick={() => setShowNotifications((prev) => !prev)}>
          Notifications {unreadNotificationsCount > 0 ? `(${unreadNotificationsCount})` : ''}
        </button>
        <div className="roleBadge">{activeRoleName}</div>
        <button className="btn btnAccentWarm" onClick={() => setShowSettingsPanel((prev) => !prev)}>
          {showSettingsPanel ? 'Close settings' : 'Open settings'}
        </button>
        <button className="btn btnPrimary" onClick={loadData}>
          Refresh board
        </button>
      </div>
    </div>
  );
}
