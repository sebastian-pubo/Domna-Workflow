'use client';

export default function SettingsModalShell({
  show,
  onClose,
  tabs,
  activeTab,
  setActiveTab,
  children,
}) {
  if (!show) {
    return null;
  }

  return (
    <div className="settingsOverlay" onClick={onClose}>
      <section className="panel settingsPanel settingsModal" id="board-setup" onClick={(event) => event.stopPropagation()}>
        <div className="settingsHeader">
          <div>
            <div className="panelTitle">Board settings</div>
            <div className="smallMuted">Manage boards, people, columns, and groups without pushing the main workspace down the page.</div>
          </div>
          <button className="iconBtn" onClick={onClose} aria-label="Close settings">
            X
          </button>
        </div>
        <div className="settingsTabBar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settingsTab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="settingsGrid">{children}</div>
      </section>
    </div>
  );
}
