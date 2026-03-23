'use client';

import TableCellRenderer from './TableCellRenderer';

export default function MainBoardTable({
  displayedGroups,
  groupBy,
  draggedTaskId,
  canEditDeals,
  moveTaskBefore,
  setDraggedTaskId,
  compactMode,
  boardGridStyle,
  visibleColumns,
  pinnedColumnOffsets,
  draggedColumnId,
  setDraggedColumnId,
  canEditBoardStructure,
  reorderColumn,
  allDisplayedTaskIds,
  selectedTaskIds,
  toggleTaskSelection,
  toggleAllDisplayedSelection,
  renameColumn,
  beginColumnResize,
  showInlineColumnCreator,
  setShowInlineColumnCreator,
  columnDraftName,
  setColumnDraftName,
  columnDraftType,
  setColumnDraftType,
  setColumnDraftOptions,
  setColumnDraftOptionLabel,
  setColumnDraftOptionColor,
  OPTION_COLORS,
  setColumnDraftLinks,
  progressEligibleColumns,
  columnDraftLinks,
  formulaDraftType,
  setFormulaDraftType,
  FORMULA_CHOICES,
  OPTION_COLOR_CHOICES,
  columnDraftOptionLabel,
  setColumnDraftOptionLabelDirect,
  columnDraftOptionColor,
  setColumnDraftOptionColorDirect,
  addDraftColumnOption,
  columnDraftOptions,
  updateDraftColumnOption,
  removeDraftColumnOption,
  addColumn,
  boardGroups,
  assessorDirectory,
  updateTaskFieldInline,
  updateIssueDraft,
  commitIssueDraft,
  updateCustomFieldInline,
  patchTask,
  persistTask,
  openTask,
  getIssuesInputValue,
  getProgressForTask,
  getFormulaValue,
  getAttachmentBadge,
  getOptionTone,
  toneClass,
}) {
  return (
    <div className="tableBoard" id="main-board">
      {displayedGroups.map((group) => (
        <section
          key={group.id}
          className="groupSection"
          onDragOver={(event) => {
            if (groupBy === 'stage') event.preventDefault();
          }}
          onDrop={() => {
            if (groupBy === 'stage' && draggedTaskId) {
              moveTaskBefore(draggedTaskId, group.id, null);
              setDraggedTaskId(null);
            }
          }}
        >
          <div className={`groupBanner ${group.ui_class || ''}`}>
            <div className="groupTitleWrap">
              <h2 className="groupTitle">{group.name}</h2>
              <span className="groupCount">{group.tasks.length}</span>
            </div>
            <div className="groupHint">
              {groupBy === 'stage' ? 'Drop a row here to move it into this stage.' : 'Grouped view for planning and review.'}
            </div>
          </div>

          <div className="tableWrap">
            <div className={`tableHeader boardGrid ${compactMode ? 'compactMode' : ''}`} style={boardGridStyle}>
              {visibleColumns.map((column) => (
                <div
                  key={column.id}
                  className={`headerCell ${column.isCustom ? 'headerCellColumn' : ''} ${pinnedColumnOffsets[column.id] !== undefined ? 'boardCellPinned boardHeaderPinned' : ''}`}
                  style={pinnedColumnOffsets[column.id] !== undefined ? { left: `${pinnedColumnOffsets[column.id]}px` } : undefined}
                  onDragOver={(event) => {
                    if (!draggedColumnId || draggedColumnId === column.id) return;
                    event.preventDefault();
                  }}
                  onDrop={async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!draggedColumnId || draggedColumnId === column.id) return;
                    await reorderColumn(draggedColumnId, column.id);
                    setDraggedColumnId(null);
                  }}
                >
                  <div className="headerContent">
                    <button
                      type="button"
                      className="columnMoveHandle"
                      draggable={canEditBoardStructure()}
                      onDragStart={() => setDraggedColumnId(column.id)}
                      onDragEnd={() => setDraggedColumnId(null)}
                      aria-label={`Move ${column.label} column`}
                    >
                      :: 
                    </button>
                    {column.isCustom ? (
                      <input
                        className="columnHeaderInput"
                        defaultValue={column.label || column.name}
                        disabled={!canEditBoardStructure()}
                        onBlur={(event) => renameColumn(column.id, event.target.value)}
                      />
                    ) : column.id === 'item' ? (
                      <div className="headerSelectWrap">
                        <input
                          type="checkbox"
                          className="rowCheckbox"
                          checked={allDisplayedTaskIds.length > 0 && allDisplayedTaskIds.every((taskId) => selectedTaskIds.includes(taskId))}
                          onChange={toggleAllDisplayedSelection}
                          aria-label="Select all visible deals"
                        />
                        <span>{column.label}</span>
                      </div>
                    ) : (
                      <span>{column.label}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="columnResizeHandle"
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                    disabled={!canEditBoardStructure()}
                    onPointerDown={(event) => beginColumnResize(column.id, event)}
                    aria-label={`Resize ${column.label} column`}
                  />
                </div>
              ))}
            </div>

            <div className="headerActionsRow">
              <button className="headerAddButton" onClick={() => setShowInlineColumnCreator((prev) => !prev)} disabled={!canEditBoardStructure()}>
                {showInlineColumnCreator ? 'Close' : '+ Column'}
              </button>
            </div>

            {showInlineColumnCreator && (
              <div className="inlineColumnCreator">
                <input className="input" value={columnDraftName} onChange={(event) => setColumnDraftName(event.target.value)} placeholder="Column name" />
                <select
                  className="select"
                  value={columnDraftType}
                  onChange={(event) => {
                    const nextType = event.target.value;
                    setColumnDraftType(nextType);
                    if (!['select', 'status', 'multi_select'].includes(nextType)) {
                      setColumnDraftOptions([]);
                      setColumnDraftOptionLabel('');
                      setColumnDraftOptionColor(OPTION_COLORS[0]);
                    }
                    if (nextType !== 'progress') {
                      setColumnDraftLinks([]);
                    }
                  }}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Dropdown</option>
                  <option value="status">Status</option>
                  <option value="multi_select">Multi select</option>
                  <option value="progress">Progress</option>
                  <option value="formula">Formula</option>
                </select>
                {['select', 'status', 'multi_select'].includes(columnDraftType) && (
                  <div className="inlineOptionBuilder">
                    <div className="optionEditorRow">
                      <input className="input" value={columnDraftOptionLabel} onChange={(event) => setColumnDraftOptionLabelDirect(event.target.value)} placeholder="Option label" />
                      <select className="select optionColorSelect" value={columnDraftOptionColor} onChange={(event) => setColumnDraftOptionColorDirect(event.target.value)}>
                        {OPTION_COLOR_CHOICES.map((choice) => (
                          <option key={choice.value} value={choice.value}>
                            {choice.label}
                          </option>
                        ))}
                      </select>
                      <button className="btn" type="button" onClick={addDraftColumnOption}>Add option</button>
                    </div>
                    {columnDraftOptions.length > 0 && (
                      <div className="optionEditorList">
                        {columnDraftOptions.map((option, optionIndex) => (
                          <div key={`${option.label}-${optionIndex}`} className="optionEditorRow">
                            <input
                              className="input"
                              value={option.label}
                              onChange={(event) => updateDraftColumnOption(optionIndex, { label: event.target.value })}
                              placeholder="Option label"
                            />
                            <select
                              className="select optionColorSelect"
                              value={option.color}
                              onChange={(event) => updateDraftColumnOption(optionIndex, { color: event.target.value })}
                            >
                              {OPTION_COLOR_CHOICES.map((choice) => (
                                <option key={choice.value} value={choice.value}>
                                  {choice.label}
                                </option>
                              ))}
                            </select>
                            <button className="btn" type="button" onClick={() => removeDraftColumnOption(optionIndex)}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {columnDraftType === 'progress' && (
                  <div className="progressLinkBuilder">
                    {progressEligibleColumns.map((column) => (
                      <label key={column.id} className="progressLinkOption">
                        <input
                          type="checkbox"
                          checked={columnDraftLinks.includes(column.id)}
                          onChange={(event) =>
                            setColumnDraftLinks((prev) => (event.target.checked ? [...prev, column.id] : prev.filter((id) => id !== column.id)))
                          }
                        />
                        <span>{column.label || column.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {columnDraftType === 'formula' && (
                  <select className="select" value={formulaDraftType} onChange={(event) => setFormulaDraftType(event.target.value)}>
                    {FORMULA_CHOICES.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                )}
                <button className="btn" onClick={addColumn} disabled={!canEditBoardStructure()}>
                  Add column
                </button>
              </div>
            )}

            {group.tasks.length === 0 ? (
              <div className="emptyState emptyStateInline">No deals in this group yet.</div>
            ) : (
              group.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`tableRow boardGrid ${compactMode ? 'compactMode' : ''} ${selectedTaskIds.includes(task.id) ? 'selected' : ''}`}
                  style={boardGridStyle}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (groupBy === 'stage' && draggedTaskId && draggedTaskId !== task.id) {
                      moveTaskBefore(draggedTaskId, group.id, task.id);
                      setDraggedTaskId(null);
                    }
                  }}
                >
                  {visibleColumns.map((column) => (
                    <TableCellRenderer
                      key={column.id}
                      column={column}
                      task={task}
                      group={group}
                      pinnedColumnOffsets={pinnedColumnOffsets}
                      getOptionTone={getOptionTone}
                      toneClass={toneClass}
                      updateCustomFieldInline={updateCustomFieldInline}
                      getProgressForTask={getProgressForTask}
                      getFormulaValue={getFormulaValue}
                      selectedTaskIds={selectedTaskIds}
                      toggleTaskSelection={toggleTaskSelection}
                      groupBy={groupBy}
                      setDraggedTaskId={setDraggedTaskId}
                      patchTask={patchTask}
                      persistTask={persistTask}
                      openTask={openTask}
                      boardGroups={boardGroups}
                      assessorDirectory={assessorDirectory}
                      updateTaskFieldInline={updateTaskFieldInline}
                      getIssuesInputValue={getIssuesInputValue}
                      updateIssueDraft={updateIssueDraft}
                      commitIssueDraft={commitIssueDraft}
                      getAttachmentBadge={getAttachmentBadge}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
