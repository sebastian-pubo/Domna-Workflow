'use client';

export default function FiltersPanel({
  show,
  viewDraftName,
  setViewDraftName,
  saveCurrentView,
  boardSavedViews,
  selectedViewId,
  applySavedView,
  deleteSavedView,
  assessorFilter,
  setAssessorFilter,
  assessorOptions,
  priorityFilter,
  setPriorityFilter,
  qaFilter,
  setQaFilter,
  qaOptions,
  selectedViewName,
  clearFilters,
}) {
  if (!show) return null;

  return (
    <section className="panel filterPanel" id="board-filters">
      <div className="panelTitle">Board filters</div>
      <div className="viewBuilder">
        <div>
          <label className="label">Saved view name</label>
          <input className="input" value={viewDraftName} onChange={(event) => setViewDraftName(event.target.value)} placeholder="Example: My tasks, QA focus, Due this week" />
        </div>
        <button className="btn" onClick={saveCurrentView}>Save current view</button>
      </div>
      <div className="viewList">
        {boardSavedViews.length === 0 ? (
          <div className="smallMuted">Saved views will appear here once you store a board setup.</div>
        ) : (
          boardSavedViews.map((view) => (
            <div key={view.id} className={`viewChip ${selectedViewId === view.id ? 'active' : ''}`}>
              <button className="viewChipButton" onClick={() => applySavedView(view)}>
                {view.name}
              </button>
              <button className="viewDeleteButton" onClick={() => deleteSavedView(view.id)} aria-label={`Delete ${view.name} view`}>
                x
              </button>
            </div>
          ))
        )}
      </div>
      <div className="filterGrid">
        <div>
          <label className="label">Assessor</label>
          <select className="select" value={assessorFilter} onChange={(event) => setAssessorFilter(event.target.value)}>
            {assessorOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="select" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="All">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label className="label">QA status</label>
          <select className="select" value={qaFilter} onChange={(event) => setQaFilter(event.target.value)}>
            {qaOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div className="filterSummary">
          <div className="label">Working view</div>
          <div className="smallMuted">
            {selectedViewName
              ? `Saved view active: ${selectedViewName}`
              : 'Rows are sorted by due date first, then priority. Use filters to focus the board quickly.'}
          </div>
        </div>
        <div className="filterActions">
          <button className="btn" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      </div>
    </section>
  );
}
