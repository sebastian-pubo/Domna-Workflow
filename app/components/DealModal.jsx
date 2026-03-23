'use client';

export default function DealModal({
  selectedTask,
  setSelectedTask,
  toneClass,
  formatDate,
  assessorDirectory,
  boardColumns,
  allColumns,
  hiddenColumnIds,
  getOptionTone,
  updateCustomField,
  getProgressForTask,
  getFormulaValue,
  getIssuesInputValue,
  uploadCategory,
  setUploadCategory,
  FILE_CATEGORY_OPTIONS,
  uploadFiles,
  formatDateTime,
  removeAttachment,
  getTaskDependencies,
  updateTaskDependencies,
  boardTasks,
  taskMeta,
  formatDuration,
  getTrackedMinutes,
  toggleTimeTracking,
  getTaskTimeEntries,
  newTemplateName,
  setNewTemplateName,
  saveCurrentTaskAsTemplate,
  duplicateTask,
  archiveSelectedTask,
  canDeleteDeals,
  deleteSelectedTask,
  saveTaskChanges,
  newComment,
  setNewComment,
  addComment,
}) {
  if (!selectedTask) return null;

  return (
    <div className="overlay" onClick={() => setSelectedTask(null)}>
      <div className="modalCard" onClick={(event) => event.stopPropagation()}>
        <div className="modalGrid">
          <div className="modalMain">
            <div className="modalTop">
              <div>
                <h2 className="modalTitle">{selectedTask.title}</h2>
                <div className="modalMeta">
                  <span className={`pill ${toneClass('status', selectedTask.status)}`}>{selectedTask.status}</span>
                  <span className={`pill ${toneClass('priority', selectedTask.priority)}`}>{selectedTask.priority}</span>
                  <span className="pill">Due {selectedTask.due_date ? formatDate(selectedTask.due_date) : 'TBC'}</span>
                </div>
              </div>
              <button className="iconBtn" onClick={() => setSelectedTask(null)} aria-label="Close task panel">X</button>
            </div>

            <div className="fieldGrid">
              <div>
                <label className="label">Title</label>
                <input className="input" value={selectedTask.title} onChange={(event) => setSelectedTask((prev) => ({ ...prev, title: event.target.value }))} />
              </div>
              <div>
                <label className="label">Assessor</label>
                <select className="select" value={selectedTask.assessor || 'Unassigned'} onChange={(event) => setSelectedTask((prev) => ({ ...prev, assessor: event.target.value }))}>
                  {assessorDirectory.map((assessor) => <option key={assessor.id} value={assessor.name}>{assessor.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Due date</label>
                <input className="input" type="date" value={selectedTask.due_date || ''} onChange={(event) => setSelectedTask((prev) => ({ ...prev, due_date: event.target.value }))} />
              </div>
              <div>
                <label className="label">QA status</label>
                <input className="input" value={selectedTask.qa_status || ''} onChange={(event) => setSelectedTask((prev) => ({ ...prev, qa_status: event.target.value }))} />
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="select" value={selectedTask.priority || 'Medium'} onChange={(event) => setSelectedTask((prev) => ({ ...prev, priority: event.target.value }))}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="label">MagicPlan</label>
                <select className="select" value={selectedTask.magicplan_status || 'No'} onChange={(event) => setSelectedTask((prev) => ({ ...prev, magicplan_status: event.target.value }))}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
            </div>

            {boardColumns.length > 0 && (
              <div className="customFieldGrid">
                {allColumns.filter((column) => column.isCustom && !hiddenColumnIds.includes(column.id)).map((column) => (
                  <div key={column.id}>
                    <label className="label">{column.label || column.name}</label>
                    {['select', 'status'].includes(column.type) ? (
                      <select
                        className={`select ${getOptionTone(column.options?.find((option) => option.label === (selectedTask.customFields?.[column.id] || ''))?.color)} ${column.type === 'status' ? 'statusSelect' : ''}`}
                        value={selectedTask.customFields?.[column.id] || ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          setSelectedTask((prev) => ({ ...prev, customFields: { ...(prev.customFields || {}), [column.id]: value } }));
                          updateCustomField(selectedTask.id, column.id, value);
                        }}
                      >
                        <option value="">Select</option>
                        {(column.options || []).map((option) => <option key={option.label} value={option.label}>{option.label}</option>)}
                      </select>
                    ) : column.type === 'multi_select' ? (
                      <div className="modalMultiSelect">
                        <div className="multiSelectTags">
                          {(Array.isArray(selectedTask.customFields?.[column.id]) ? selectedTask.customFields?.[column.id] : []).map((value) => {
                            const activeOption = column.options?.find((option) => option.label === value);
                            return <span key={value} className={`multiSelectTag ${activeOption ? getOptionTone(activeOption.color) : ''}`}>{value}</span>;
                          })}
                        </div>
                        <select
                          className="select"
                          value=""
                          onChange={(event) => {
                            if (!event.target.value) return;
                            const selectedValues = Array.isArray(selectedTask.customFields?.[column.id]) ? selectedTask.customFields?.[column.id] : [];
                            if (selectedValues.includes(event.target.value)) return;
                            const nextValues = [...selectedValues, event.target.value];
                            setSelectedTask((prev) => ({ ...prev, customFields: { ...(prev.customFields || {}), [column.id]: nextValues } }));
                            updateCustomField(selectedTask.id, column.id, nextValues);
                          }}
                        >
                          <option value="">Add option</option>
                          {(column.options || []).filter((option) => !(Array.isArray(selectedTask.customFields?.[column.id]) ? selectedTask.customFields?.[column.id] : []).includes(option.label)).map((option) => (
                            <option key={option.label} value={option.label}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : column.type === 'progress' ? (
                      <div className="progressCell progressCellModal">
                        <div className="progressTrack">
                          <div className="progressFill" style={{ width: `${getProgressForTask(selectedTask, column)}%` }} />
                        </div>
                        <span className="progressValue">{getProgressForTask(selectedTask, column)}%</span>
                      </div>
                    ) : column.type === 'formula' ? (
                      <div className="formulaCell formulaCellModal">
                        <span className="formulaValue">{getFormulaValue(selectedTask, column)}</span>
                      </div>
                    ) : (
                      <input
                        className="input"
                        type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                        value={selectedTask.customFields?.[column.id] || ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          setSelectedTask((prev) => ({ ...prev, customFields: { ...(prev.customFields || {}), [column.id]: value } }));
                          updateCustomField(selectedTask.id, column.id, value);
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="stackSection">
              <label className="label">Issues</label>
              <input
                className="input"
                value={getIssuesInputValue(selectedTask)}
                onChange={(event) => setSelectedTask((prev) => ({ ...prev, issueDraft: event.target.value }))}
              />
            </div>

            <div className="stackSection">
              <label className="label">Notes</label>
              <textarea className="textarea" rows={6} value={selectedTask.notes || ''} onChange={(event) => setSelectedTask((prev) => ({ ...prev, notes: event.target.value }))} />
            </div>

            <div className="stackSection">
              <div className="sectionHeader"><h3>Files / EPC evidence</h3></div>
              <select className="select" value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value)}>
                {FILE_CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <label className="uploadBox">
                <span>Upload photos or supporting EPC evidence</span>
                <input type="file" multiple onChange={uploadFiles} />
              </label>
              <div className="attachmentList">
                {(selectedTask.attachments || []).length === 0 ? (
                  <div className="smallMuted">No files attached yet.</div>
                ) : (
                  selectedTask.attachments.map((attachment) => (
                    <div key={attachment.id} className="attachmentCard">
                      <div>{attachment.name}</div>
                      <div className="attachmentMeta">{attachment.category || 'General'}</div>
                      <div className="attachmentMeta">{Math.round((attachment.size || 0) / 1024)} KB / {formatDateTime(attachment.uploadedAt)}</div>
                      <div className="attachmentActions">
                        {attachment.url && <a className="textButton" href={attachment.url} target="_blank" rel="noreferrer">Open file</a>}
                        <button className="textButton" onClick={() => removeAttachment(attachment)}>Remove</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="stackSection">
              <div className="sectionHeader"><h3>Dependencies</h3></div>
              <select
                className="select"
                value=""
                onChange={(event) => {
                  if (!event.target.value) return;
                  const existing = getTaskDependencies(selectedTask);
                  if (existing.includes(event.target.value)) return;
                  updateTaskDependencies(selectedTask.id, [...existing, event.target.value]);
                }}
              >
                <option value="">Link another deal</option>
                {boardTasks.filter((task) => task.id !== selectedTask.id && !getTaskDependencies(selectedTask).includes(task.id)).map((task) => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
              <div className="multiSelectTags">
                {getTaskDependencies(selectedTask).length === 0 ? (
                  <span className="smallMuted">No dependencies linked.</span>
                ) : (
                  getTaskDependencies(selectedTask).map((dependencyId) => {
                    const dependency = boardTasks.find((task) => task.id === dependencyId);
                    return (
                      <button
                        key={dependencyId}
                        type="button"
                        className="multiSelectTag"
                        onClick={() => updateTaskDependencies(selectedTask.id, getTaskDependencies(selectedTask).filter((id) => id !== dependencyId))}
                      >
                        {dependency?.title || dependencyId}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="stackSection">
              <div className="sectionHeader"><h3>Time tracking</h3></div>
              <div className="timeTrackerRow">
                <div className="smallMuted">Tracked so far: {formatDuration(getTrackedMinutes(selectedTask))}</div>
                <button className="btn" onClick={() => toggleTimeTracking(selectedTask)}>
                  {taskMeta[selectedTask.id]?.timerStartedAt ? 'Stop timer' : 'Start timer'}
                </button>
              </div>
              <div className="commentList">
                {getTaskTimeEntries(selectedTask).length === 0 ? (
                  <div className="emptyState emptyStateInline">No time entries yet.</div>
                ) : (
                  getTaskTimeEntries(selectedTask).map((entry) => (
                    <div key={entry.id} className="commentCard">
                      <div className="commentAuthor">{formatDuration(entry.minutes)}</div>
                      <div className="commentMeta">{formatDateTime(entry.startedAt)} {'->'} {formatDateTime(entry.endedAt)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modalActions">
              <button className="btn btnPrimary" onClick={saveTaskChanges}>Save changes</button>
              <input className="input modalTemplateInput" value={newTemplateName} onChange={(event) => setNewTemplateName(event.target.value)} placeholder="Template name (optional)" />
              <button className="btn" onClick={saveCurrentTaskAsTemplate}>Save as template</button>
              <button className="btn" onClick={() => duplicateTask(selectedTask)}>Duplicate deal</button>
              <button className="btn" onClick={archiveSelectedTask} disabled={!canDeleteDeals()}>Archive deal</button>
              <button className="btn btnDanger" onClick={deleteSelectedTask} disabled={!canDeleteDeals()}>Delete deal</button>
              <button className="btn" onClick={() => setSelectedTask(null)}>Close</button>
            </div>
          </div>

          <div className="modalSide">
            <div className="sectionHeader"><h3>Updates</h3></div>
            <p className="smallMuted">Use this area for QA notes, handover updates, and manager feedback.</p>

            <div className="commentList">
              {(selectedTask.comments || []).length === 0 ? (
                <div className="emptyState emptyStateInline">No comments yet.</div>
              ) : (
                selectedTask.comments.map((comment) => (
                  <div className="commentCard" key={comment.id}>
                    <div className="commentAuthor">{comment.author || 'Team'}</div>
                    <div className="commentMeta">{formatDateTime(comment.created_at)}</div>
                    <div className="commentText">{comment.text}</div>
                  </div>
                ))
              )}
            </div>

            <div className="stackSection">
              <label className="label">Add comment</label>
              <textarea className="textarea" rows={5} value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Add update, QA note, or manager comment..." />
            </div>
            <button className="btn btnPrimary" onClick={addComment}>Add update</button>

            <div className="stackSection">
              <div className="sectionHeader"><h3>Activity history</h3></div>
              <div className="commentList">
                {(taskMeta[selectedTask.id]?.activity || []).length === 0 ? (
                  <div className="emptyState emptyStateInline">No activity captured yet.</div>
                ) : (
                  (taskMeta[selectedTask.id]?.activity || []).map((entry) => (
                    <div key={entry.id} className="commentCard">
                      <div className="commentAuthor">{entry.title}</div>
                      <div className="commentMeta">{formatDateTime(entry.created_at)}</div>
                      <div className="commentText">{entry.description}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
