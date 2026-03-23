'use client';

export default function BulkActionsBar({
  currentWorkspaceView,
  selectedTaskIds,
  selectedDeals,
  boardGroups,
  bulkMoveSelected,
  assessorDirectory,
  bulkUpdateField,
  qaOptions,
  bulkArchiveSelected,
  canDeleteDeals,
  bulkDeleteSelected,
  setSelectedTaskIds,
}) {
  if (!(selectedTaskIds.length > 0 && currentWorkspaceView.type === 'main')) {
    return null;
  }

  return (
    <section className="panel bulkBar">
      <div className="bulkBarSummary">{selectedDeals.length} deals selected</div>
      <div className="bulkBarActions">
        <select
          className="select bulkSelect"
          defaultValue=""
          onChange={(event) => {
            if (!event.target.value) return;
            bulkMoveSelected(event.target.value);
            event.target.value = '';
          }}
        >
          <option value="">Move selected to stage...</option>
          {boardGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <select
          className="select bulkSelect"
          defaultValue=""
          onChange={(event) => {
            if (!event.target.value) return;
            bulkUpdateField('assessor', event.target.value);
            event.target.value = '';
          }}
        >
          <option value="">Change assessor...</option>
          {assessorDirectory.map((assessor) => (
            <option key={assessor.id} value={assessor.name}>
              {assessor.name}
            </option>
          ))}
        </select>
        <select
          className="select bulkSelect"
          defaultValue=""
          onChange={(event) => {
            if (!event.target.value) return;
            bulkUpdateField('priority', event.target.value);
            event.target.value = '';
          }}
        >
          <option value="">Change priority...</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select
          className="select bulkSelect"
          defaultValue=""
          onChange={(event) => {
            if (!event.target.value) return;
            bulkUpdateField('qa_status', event.target.value);
            event.target.value = '';
          }}
        >
          <option value="">Change QA status...</option>
          {qaOptions
            .filter((option) => option !== 'All')
            .map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
        </select>
        <button className="btn" onClick={bulkArchiveSelected} disabled={!canDeleteDeals()}>
          Archive selected
        </button>
        <button className="btn btnDanger" onClick={bulkDeleteSelected} disabled={!canDeleteDeals()}>
          Delete selected
        </button>
        <button className="btn" onClick={() => setSelectedTaskIds([])}>
          Clear selection
        </button>
      </div>
    </section>
  );
}
