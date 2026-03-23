'use client';

export default function ColumnsSettingsSection({
  allColumns,
  pendingColumnDeleteId,
  setPendingColumnDeleteId,
  hiddenColumnIds,
  toggleColumnVisibility,
  removeColumn,
  OPTION_COLOR_CHOICES,
  updateColumnOptions,
  getColumnOptionDraft,
  updateColumnOptionDraft,
  clearColumnOptionDraft,
  makeOption,
  progressEligibleColumns,
  getCompletionValuesForColumn,
}) {
  return (
    <section className="settingsSection settingsSectionWide">
      <div className="panelTitle panelTitleSmall">Columns</div>
      <div className="smallMuted">Hide or remove columns here. Rename, resize, and drag them from the board header.</div>
      <div className="columnManager">
        {allColumns.length === 0 ? (
          <div className="smallMuted">No columns yet. Add one from the board header.</div>
        ) : (
          allColumns.map((column) => (
            <div key={column.id} className={`columnCard ${pendingColumnDeleteId === column.id ? 'danger' : ''}`}>
              <div>
                <div className="columnCardName">{column.label || column.name}</div>
                <div className="columnCardMeta">
                  <span>{column.type}</span>
                  {['select', 'status', 'multi_select'].includes(column.type) && column.options?.length > 0 && <span>{column.options.length} options</span>}
                  {column.type === 'progress' && column.options?.length > 0 && <span>{column.options.length} linked</span>}
                </div>
              </div>
              {column.isCustom && ['select', 'status', 'multi_select'].includes(column.type) && (
                <div className="columnOptionEditor">
                  {(column.options || []).map((option, optionIndex) => (
                    <div key={`${column.id}-${optionIndex}`} className="optionEditorRow">
                      <input
                        className="input"
                        value={option.label}
                        onChange={(event) => {
                          const nextOptions = (column.options || []).map((currentOption, currentIndex) => (
                            currentIndex === optionIndex ? { ...currentOption, label: event.target.value } : currentOption
                          ));
                          updateColumnOptions(column.id, nextOptions);
                        }}
                        placeholder="Option label"
                      />
                      <select
                        className="select optionColorSelect"
                        value={option.color}
                        onChange={(event) => {
                          const nextOptions = (column.options || []).map((currentOption, currentIndex) => (
                            currentIndex === optionIndex ? { ...currentOption, color: event.target.value } : currentOption
                          ));
                          updateColumnOptions(column.id, nextOptions);
                        }}
                      >
                        {OPTION_COLOR_CHOICES.map((choice) => (
                          <option key={choice.value} value={choice.value}>{choice.label}</option>
                        ))}
                      </select>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => updateColumnOptions(column.id, (column.options || []).filter((_, currentIndex) => currentIndex !== optionIndex))}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="optionEditorRow">
                    <input
                      className="input"
                      value={getColumnOptionDraft(column.id).label}
                      onChange={(event) => updateColumnOptionDraft(column.id, { label: event.target.value })}
                      placeholder="New option"
                    />
                    <select
                      className="select optionColorSelect"
                      value={getColumnOptionDraft(column.id).color}
                      onChange={(event) => updateColumnOptionDraft(column.id, { color: event.target.value })}
                    >
                      {OPTION_COLOR_CHOICES.map((choice) => (
                        <option key={choice.value} value={choice.value}>{choice.label}</option>
                      ))}
                    </select>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        const draft = getColumnOptionDraft(column.id);
                        const nextLabel = draft.label.trim();
                        if (!nextLabel) return;
                        updateColumnOptions(column.id, [...(column.options || []), makeOption(nextLabel, draft.color, (column.options || []).length)]);
                        clearColumnOptionDraft(column.id);
                      }}
                    >
                      Add option
                    </button>
                  </div>
                </div>
              )}
              {column.isCustom && column.type === 'progress' && (
                <div className="progressLinkBuilder">
                  {progressEligibleColumns.filter((candidate) => candidate.id !== column.id).map((candidate) => {
                    const linkedOption = (column.options || []).find((option) => option.columnId === candidate.id);
                    return (
                      <div key={`${column.id}-${candidate.id}`} className="progressLinkEditor">
                        <label className="progressLinkOption">
                          <input
                            type="checkbox"
                            checked={Boolean(linkedOption)}
                            onChange={(event) => {
                              const nextLinks = event.target.checked
                                ? [...(column.options || []), { columnId: candidate.id, label: candidate.label || candidate.name, targetValue: '', weight: 1 }]
                                : (column.options || []).filter((option) => option.columnId !== candidate.id);
                              updateColumnOptions(column.id, nextLinks);
                            }}
                          />
                          <span>{candidate.label || candidate.name}</span>
                        </label>
                        {linkedOption && (
                          <div className="progressLinkFields">
                            <select
                              className="select"
                              value={linkedOption.targetValue || ''}
                              onChange={(event) => updateColumnOptions(column.id, (column.options || []).map((option) => (
                                option.columnId === candidate.id ? { ...option, targetValue: event.target.value } : option
                              )))}
                            >
                              <option value="">Any value</option>
                              {getCompletionValuesForColumn(candidate.id).map((value) => (
                                <option key={value} value={value}>{value}</option>
                              ))}
                            </select>
                            <input
                              className="input"
                              type="number"
                              min="1"
                              value={linkedOption.weight || 1}
                              onChange={(event) => updateColumnOptions(column.id, (column.options || []).map((option) => (
                                option.columnId === candidate.id ? { ...option, weight: Math.max(1, Number(event.target.value) || 1) } : option
                              )))}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {column.isCustom && column.type === 'formula' && (
                <div className="optionEditorRow">
                  <select
                    className="select"
                    value={column.options?.formula || 'days_until_due'}
                    onChange={(event) => updateColumnOptions(column.id, { formula: event.target.value })}
                  >
                    <option value="days_until_due">Days until due</option>
                    <option value="days_overdue">Days overdue</option>
                    <option value="attachment_count">Attachment count</option>
                    <option value="issue_count">Issue count</option>
                    <option value="comment_count">Comment count</option>
                    <option value="progress_average">Average progress</option>
                  </select>
                </div>
              )}
              <div className="columnCardActions">
                <button className="btn" onClick={() => toggleColumnVisibility(column.id)}>
                  {hiddenColumnIds.includes(column.id) ? 'Show column' : 'Hide column'}
                </button>
                {column.isCustom && pendingColumnDeleteId === column.id ? (
                  <>
                    <button className="btn btnDanger" onClick={() => removeColumn(column.id)}>Delete</button>
                    <button className="btn" onClick={() => setPendingColumnDeleteId(null)}>Cancel</button>
                  </>
                ) : column.isCustom ? (
                  <button className="btn" onClick={() => setPendingColumnDeleteId(column.id)}>Remove column</button>
                ) : (
                  <div className="smallMuted">Core column</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
