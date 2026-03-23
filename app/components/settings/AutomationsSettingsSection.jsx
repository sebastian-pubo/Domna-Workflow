'use client';

export default function AutomationsSettingsSection({
  AUTOMATION_PRESETS,
  applyAutomationPreset,
  automationDraftName,
  setAutomationDraftName,
  automationDraftTrigger,
  setAutomationDraftTrigger,
  automationDraftField,
  setAutomationDraftField,
  allColumns,
  getCompletionValuesForColumn,
  automationDraftValue,
  setAutomationDraftValue,
  automationDraftAction,
  setAutomationDraftAction,
  automationDraftActionValue,
  setAutomationDraftActionValue,
  boardGroups,
  assessorDirectory,
  addAutomationRule,
  boardAutomations,
  pendingAutomationArchiveId,
  setPendingAutomationArchiveId,
  pendingAutomationDeleteId,
  setPendingAutomationDeleteId,
  archiveAutomationRule,
  deleteAutomationRulePermanently,
}) {
  return (
    <section className="settingsSection">
      <div className="panelTitle panelTitleSmall">Automations</div>
      <div className="automationPresetRow">
        {AUTOMATION_PRESETS.map((preset) => (
          <button key={preset.id} className="automationPresetButton" type="button" onClick={() => applyAutomationPreset(preset)}>
            {preset.name}
          </button>
        ))}
      </div>
      <div className="directoryForm">
        <input className="input" value={automationDraftName} onChange={(event) => setAutomationDraftName(event.target.value)} placeholder="Automation name" />
        <select className="select" value={automationDraftTrigger} onChange={(event) => setAutomationDraftTrigger(event.target.value)}>
          <option value="field_equals">When field equals</option>
          <option value="field_completed">When field completes</option>
          <option value="file_added">When file added</option>
          <option value="comment_added">When update added</option>
          <option value="overdue">When overdue</option>
        </select>
        {['field_equals', 'field_completed'].includes(automationDraftTrigger) && (
          <>
            <select className="select" value={automationDraftField} onChange={(event) => setAutomationDraftField(event.target.value)}>
              {allColumns.filter((column) => column.id !== 'item').map((column) => (
                <option key={column.id} value={column.id}>
                  {column.label}
                </option>
              ))}
            </select>
            {getCompletionValuesForColumn(automationDraftField).length > 0 ? (
              <select className="select" value={automationDraftValue} onChange={(event) => setAutomationDraftValue(event.target.value)}>
                <option value="">Any matching value</option>
                {getCompletionValuesForColumn(automationDraftField).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            ) : (
              <input className="input" value={automationDraftValue} onChange={(event) => setAutomationDraftValue(event.target.value)} placeholder="Trigger value (optional)" />
            )}
          </>
        )}
        <select className="select" value={automationDraftAction} onChange={(event) => setAutomationDraftAction(event.target.value)}>
          <option value="notify">Notify</option>
          <option value="move_stage">Move stage</option>
          <option value="set_priority">Set priority</option>
          <option value="set_qa_status">Set QA status</option>
          <option value="set_assessor">Set assessor</option>
        </select>
        {automationDraftAction !== 'notify' &&
          (automationDraftAction === 'move_stage' ? (
            <select className="select" value={automationDraftActionValue} onChange={(event) => setAutomationDraftActionValue(event.target.value)}>
              <option value="">Select stage</option>
              {boardGroups.map((group) => (
                <option key={group.id} value={group.name}>
                  {group.name}
                </option>
              ))}
            </select>
          ) : automationDraftAction === 'set_priority' ? (
            <select className="select" value={automationDraftActionValue} onChange={(event) => setAutomationDraftActionValue(event.target.value)}>
              <option value="">Select priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          ) : automationDraftAction === 'set_assessor' ? (
            <select className="select" value={automationDraftActionValue} onChange={(event) => setAutomationDraftActionValue(event.target.value)}>
              <option value="">Select assessor</option>
              {assessorDirectory.map((assessor) => (
                <option key={assessor.id} value={assessor.name}>
                  {assessor.name}
                </option>
              ))}
            </select>
          ) : (
            <input className="input" value={automationDraftActionValue} onChange={(event) => setAutomationDraftActionValue(event.target.value)} placeholder="Action value" />
          ))}
        <button className="btn" onClick={addAutomationRule}>Add automation</button>
      </div>
      <div className="directoryList">
        {boardAutomations.map((rule) => (
          <div key={rule.id} className="directoryCard">
            <div className="automationCardHeader">
              <div className="scoreName">{rule.name}</div>
              <span className="miniPill">{rule.action.replace(/_/g, ' ')}</span>
            </div>
            <div className="automationCardFlow">
              <span className="automationToken">{rule.trigger.replace(/_/g, ' ')}</span>
              {rule.field ? <span className="automationToken">{rule.field.replace(/_/g, ' ')}</span> : null}
              {rule.value ? <span className="automationToken">{rule.value}</span> : null}
              <span className="automationArrow">to</span>
              <span className="automationToken strong">{rule.action.replace(/_/g, ' ')}</span>
              {rule.actionValue ? <span className="automationToken">{rule.actionValue}</span> : null}
            </div>
            {pendingAutomationArchiveId === rule.id ? (
              <div className="columnCardActions">
                <button className="btn btnDanger" onClick={() => archiveAutomationRule(rule.id)}>Archive</button>
                <button className="btn" onClick={() => setPendingAutomationArchiveId(null)}>Cancel</button>
              </div>
            ) : pendingAutomationDeleteId === rule.id ? (
              <div className="columnCardActions">
                <button className="btn btnDanger" onClick={() => deleteAutomationRulePermanently(rule.id)}>Delete</button>
                <button className="btn" onClick={() => setPendingAutomationDeleteId(null)}>Cancel</button>
              </div>
            ) : (
              <div className="columnCardActions">
                <button className="textButton" onClick={() => {
                  setPendingAutomationDeleteId(null);
                  setPendingAutomationArchiveId(rule.id);
                }}>Archive</button>
                <button className="textButton" onClick={() => {
                  setPendingAutomationArchiveId(null);
                  setPendingAutomationDeleteId(rule.id);
                }}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
