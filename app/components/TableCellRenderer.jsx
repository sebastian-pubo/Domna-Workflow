'use client';

export default function TableCellRenderer({
  column,
  task,
  group,
  pinnedColumnOffsets,
  getOptionTone,
  toneClass,
  updateCustomFieldInline,
  getProgressForTask,
  getFormulaValue,
  selectedTaskIds,
  toggleTaskSelection,
  groupBy,
  setDraggedTaskId,
  patchTask,
  persistTask,
  openTask,
  boardGroups,
  assessorDirectory,
  updateTaskFieldInline,
  getIssuesInputValue,
  updateIssueDraft,
  commitIssueDraft,
  getAttachmentBadge,
}) {
  const pinnedStyle = pinnedColumnOffsets[column.id] !== undefined ? { left: `${pinnedColumnOffsets[column.id]}px` } : undefined;
  const cellClassName = pinnedColumnOffsets[column.id] !== undefined ? 'boardCellPinned' : '';

  if (column.isCustom) {
    if (['select', 'status'].includes(column.type)) {
      const activeOption = column.options?.find((option) => option.label === (task.customFields?.[column.id] || ''));
      return (
        <select
          key={column.id}
          className={`cellSelect ${cellClassName} ${activeOption ? getOptionTone(activeOption.color) : ''} ${column.type === 'status' ? 'statusSelect' : ''}`}
          style={pinnedStyle}
          value={task.customFields?.[column.id] || ''}
          onChange={(event) => updateCustomFieldInline(task.id, column.id, event.target.value)}
        >
          <option value="">Select</option>
          {(column.options || []).map((option) => <option key={option.label} value={option.label}>{option.label}</option>)}
        </select>
      );
    }

    if (column.type === 'multi_select') {
      const selectedValues = Array.isArray(task.customFields?.[column.id]) ? task.customFields?.[column.id] : [];
      return (
        <div key={column.id} className={`multiSelectCell ${cellClassName}`} style={pinnedStyle}>
          <div className="multiSelectTags">
            {selectedValues.length === 0 ? (
              <span className="smallMuted">None</span>
            ) : (
              selectedValues.map((value) => {
                const activeOption = column.options?.find((option) => option.label === value);
                return (
                  <button
                    key={value}
                    type="button"
                    className={`multiSelectTag ${activeOption ? getOptionTone(activeOption.color) : ''}`}
                    onClick={() => updateCustomFieldInline(task.id, column.id, selectedValues.filter((item) => item !== value))}
                  >
                    {value}
                  </button>
                );
              })
            )}
          </div>
          <select
            className="cellSelect multiSelectAdder"
            value=""
            onChange={(event) => {
              if (!event.target.value) return;
              if (selectedValues.includes(event.target.value)) return;
              updateCustomFieldInline(task.id, column.id, [...selectedValues, event.target.value]);
            }}
          >
            <option value="">Add option</option>
            {(column.options || []).filter((option) => !selectedValues.includes(option.label)).map((option) => (
              <option key={option.label} value={option.label}>{option.label}</option>
            ))}
          </select>
        </div>
      );
    }

    if (column.type === 'progress') {
      const progress = getProgressForTask(task, column);
      return (
        <div key={column.id} className={`progressCell ${cellClassName}`} style={pinnedStyle}>
          <div className="progressTrack">
            <div className="progressFill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progressValue">{progress}%</span>
        </div>
      );
    }

    if (column.type === 'formula') {
      return (
        <div key={column.id} className={`formulaCell ${cellClassName}`} style={pinnedStyle}>
          <span className="formulaValue">{getFormulaValue(task, column)}</span>
        </div>
      );
    }

    return (
      <input
        key={column.id}
        className={`cellInput ${cellClassName}`}
        style={pinnedStyle}
        type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
        value={task.customFields?.[column.id] || ''}
        onChange={(event) => updateCustomFieldInline(task.id, column.id, event.target.value)}
      />
    );
  }

  if (column.id === 'item') {
    return (
      <div className={`itemCell ${cellClassName}`} style={pinnedStyle} key={column.id}>
        <input
          type="checkbox"
          className="rowCheckbox"
          checked={selectedTaskIds.includes(task.id)}
          onPointerDown={(event) => event.stopPropagation()}
          onChange={() => toggleTaskSelection(task.id)}
          aria-label={`Select ${task.title}`}
        />
        <span
          className="dragHandle"
          draggable={groupBy === 'stage'}
          onDragStart={() => setDraggedTaskId(task.id)}
          onDragEnd={() => setDraggedTaskId(null)}
        >
          ::
        </span>
        <input
          className="itemTitleInput"
          value={task.title || ''}
          onChange={(event) => patchTask(task.id, (current) => ({ ...current, title: event.target.value }))}
          onBlur={(event) => persistTask(task.id, { title: event.target.value.trim() || task.title })}
        />
        <button className="itemOpenButton" onClick={() => openTask(task)}>Open</button>
      </div>
    );
  }

  if (column.id === 'stage') {
    return (
      <select key={column.id} className={`cellSelect ${cellClassName} ${toneClass('status', task.status)}`} style={pinnedStyle} value={task.status || group.name} onChange={(event) => updateTaskFieldInline(task.id, 'status', event.target.value)}>
        {boardGroups.map((boardGroup) => <option key={boardGroup.id} value={boardGroup.name}>{boardGroup.name}</option>)}
      </select>
    );
  }

  if (column.id === 'assessor') {
    return (
      <select key={column.id} className={`cellSelect ${cellClassName}`} style={pinnedStyle} value={task.assessor || 'Unassigned'} onChange={(event) => updateTaskFieldInline(task.id, 'assessor', event.target.value)}>
        {assessorDirectory.map((assessor) => <option key={assessor.id} value={assessor.name}>{assessor.name}</option>)}
      </select>
    );
  }

  if (column.id === 'priority') {
    return (
      <select key={column.id} className={`cellSelect ${cellClassName} ${toneClass('priority', task.priority)}`} style={pinnedStyle} value={task.priority || 'Medium'} onChange={(event) => updateTaskFieldInline(task.id, 'priority', event.target.value)}>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
    );
  }

  if (column.id === 'due_date') return <input key={column.id} className={`cellInput ${cellClassName}`} style={pinnedStyle} type="date" value={task.due_date || ''} onChange={(event) => updateTaskFieldInline(task.id, 'due_date', event.target.value)} />;
  if (column.id === 'qa_status') return <input key={column.id} className={`cellInput ${cellClassName}`} style={pinnedStyle} value={task.qa_status || ''} onChange={(event) => updateTaskFieldInline(task.id, 'qa_status', event.target.value)} />;
  if (column.id === 'magicplan_status') {
    return (
      <select key={column.id} className={`cellSelect ${cellClassName}`} style={pinnedStyle} value={task.magicplan_status || 'No'} onChange={(event) => updateTaskFieldInline(task.id, 'magicplan_status', event.target.value)}>
        <option value="No">No</option>
        <option value="Yes">Yes</option>
        <option value="Mixed">Mixed</option>
      </select>
    );
  }
  if (column.id === 'issues') {
    return (
      <input
        key={column.id}
        className={`cellInput ${cellClassName}`}
        style={pinnedStyle}
        value={getIssuesInputValue(task)}
        onChange={(event) => updateIssueDraft(task.id, event.target.value)}
        onBlur={(event) => commitIssueDraft(task.id, event.target.value)}
      />
    );
  }
  if (column.id === 'files') {
    const attachments = task.attachments || [];
    return (
      <button key={column.id} className={`filesCell ${cellClassName}`} style={pinnedStyle} onClick={() => openTask(task)}>
        <div className="fileBadgeRow">
          {attachments.slice(0, 3).map((attachment) => {
            const badge = getAttachmentBadge(attachment);
            return <span key={attachment.id} className={`fileBadge ${badge.tone}`}>{attachment.category === 'General' ? badge.label : attachment.category.slice(0, 3).toUpperCase()}</span>;
          })}
          {attachments.length > 3 && <span className="fileBadge toneNeutral">+{attachments.length - 3}</span>}
          {attachments.length === 0 && <span className="smallMuted">No files</span>}
        </div>
      </button>
    );
  }
  if (column.id === 'updates') return <button key={column.id} className={`miniButton ${cellClassName}`} style={pinnedStyle} onClick={() => openTask(task)}>{(task.comments || []).length} updates</button>;
  return <div key={column.id} />;
}
