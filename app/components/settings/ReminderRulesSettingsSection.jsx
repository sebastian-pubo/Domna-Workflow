'use client';

export default function ReminderRulesSettingsSection({
  boardReminderRules,
  updateReminderRule,
  canEditBoardStructure,
}) {
  return (
    <section className="settingsSection">
      <div className="panelTitle panelTitleSmall">Reminder rules</div>
      <div className="smallMuted">Choose which board reminders should generate automatically each day.</div>
      <div className="permissionMatrix">
        <div className="permissionMatrixHeader">Board reminder rules</div>
        <div className="permissionMatrixRow">
          <div className="permissionMatrixRole">
            <div className="permissionMatrixRoleName">Overdue deals</div>
            <div className="smallMuted">Create reminders when active deals are past due.</div>
          </div>
          <label className="permissionToggle">
            <input type="checkbox" checked={Boolean(boardReminderRules.overdue)} onChange={(event) => updateReminderRule('overdue', event.target.checked)} disabled={!canEditBoardStructure()} />
            <span>Enabled</span>
          </label>
        </div>
        <div className="permissionMatrixRow">
          <div className="permissionMatrixRole">
            <div className="permissionMatrixRoleName">Due soon</div>
            <div className="smallMuted">Create reminders for deals due within the next 2 days.</div>
          </div>
          <label className="permissionToggle">
            <input type="checkbox" checked={Boolean(boardReminderRules.dueSoon)} onChange={(event) => updateReminderRule('dueSoon', event.target.checked)} disabled={!canEditBoardStructure()} />
            <span>Enabled</span>
          </label>
        </div>
        <div className="permissionMatrixRow">
          <div className="permissionMatrixRole">
            <div className="permissionMatrixRoleName">Unassigned deals</div>
            <div className="smallMuted">Create reminders when deals still have no owner.</div>
          </div>
          <label className="permissionToggle">
            <input type="checkbox" checked={Boolean(boardReminderRules.unassigned)} onChange={(event) => updateReminderRule('unassigned', event.target.checked)} disabled={!canEditBoardStructure()} />
            <span>Enabled</span>
          </label>
        </div>
      </div>
    </section>
  );
}
