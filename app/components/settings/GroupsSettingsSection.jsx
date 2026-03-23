'use client';

export default function GroupsSettingsSection({
  newGroupName,
  setNewGroupName,
  addGroup,
  canEditBoardStructure,
  boardGroups,
  pendingGroupDeleteId,
  setPendingGroupDeleteId,
  pendingGroupPermanentDeleteId,
  setPendingGroupPermanentDeleteId,
  renameGroup,
  displayedGroups,
  removeGroup,
  deleteGroupPermanently,
}) {
  return (
    <section className="settingsSection settingsSectionWide">
      <div className="panelTitle panelTitleSmall">Groups</div>
      <div className="smallMuted">Rename stages or add new ones for this board.</div>
      <div className="groupSetup">
        <div className="groupBuilder">
          <input
            className="input"
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
            placeholder="Example: Waiting on client"
          />
          <button className="btn" onClick={addGroup} disabled={!canEditBoardStructure()}>
            Add group
          </button>
        </div>
        <div className="groupManager">
          {boardGroups.map((group) => (
            <div key={group.id} className={`columnCard ${pendingGroupDeleteId === group.id ? 'danger' : ''}`}>
              <div className="groupCardMain">
                <input className="groupNameInput" defaultValue={group.name} onBlur={(event) => renameGroup(group.id, event.target.value)} />
                <div className="columnCardMeta">
                  <span>{displayedGroups.find((item) => item.id === group.id)?.tasks?.length || 0} items</span>
                </div>
              </div>
              <div className="columnCardActions">
                {pendingGroupDeleteId === group.id ? (
                  <>
                    <button className="btn btnDanger" onClick={() => removeGroup(group.id)}>
                      Archive
                    </button>
                    <button className="btn" onClick={() => setPendingGroupDeleteId(null)}>
                      Cancel
                    </button>
                  </>
                ) : pendingGroupPermanentDeleteId === group.id ? (
                  <>
                    <button className="btn btnDanger" onClick={() => deleteGroupPermanently(group.id)}>
                      Delete stage
                    </button>
                    <button className="btn" onClick={() => setPendingGroupPermanentDeleteId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn" onClick={() => {
                      setPendingGroupPermanentDeleteId(null);
                      setPendingGroupDeleteId(group.id);
                    }}>
                      Archive stage
                    </button>
                    <button className="btn" onClick={() => {
                      setPendingGroupDeleteId(null);
                      setPendingGroupPermanentDeleteId(group.id);
                    }}>
                      Delete stage
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
