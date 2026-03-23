'use client';

export default function ActionToolbar({
  quickAddInputRef,
  canEditDeals,
  searchInputRef,
  assessorFilter,
  setAssessorFilter,
  assessorOptions,
  showFiltersPanel,
  setShowFiltersPanel,
  sortMode,
  setSortMode,
  hideEmptyGroups,
  setHideEmptyGroups,
  groupBy,
  setGroupBy,
  setShowSettingsPanel,
  canEditBoardStructure,
  showSettingsPanel,
  compactMode,
  setCompactMode,
}) {
  return (
    <div className="actionBar">
      <button className="actionPill actionPillPrimary" onClick={() => quickAddInputRef.current?.focus()} disabled={!canEditDeals()}>
        New deal
      </button>
      <button className="actionPill" onClick={() => searchInputRef.current?.focus()}>
        Search
      </button>
      <select className="actionSelect" value={assessorFilter} onChange={(event) => setAssessorFilter(event.target.value)}>
        {assessorOptions.map((option) => (
          <option key={option} value={option}>
            {option === 'All' ? 'Person: All' : option}
          </option>
        ))}
      </select>
      <button className="actionPill" onClick={() => setShowFiltersPanel((prev) => !prev)}>
        {showFiltersPanel ? 'Hide filters' : 'Show filters'}
      </button>
      <select className="actionSelect" value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
        <option value="manual">Sort: Manual</option>
        <option value="dueDate">Sort: Due date</option>
        <option value="priority">Sort: Priority</option>
        <option value="title">Sort: Title</option>
      </select>
      <button className="actionPill" onClick={() => setHideEmptyGroups((prev) => !prev)}>
        {hideEmptyGroups ? 'Show empty' : 'Hide empty'}
      </button>
      <select className="actionSelect" value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
        <option value="stage">Group by: Stage</option>
        <option value="assessor">Group by: Assessor</option>
        <option value="priority">Group by: Priority</option>
      </select>
      <button className="actionPill" onClick={() => setShowSettingsPanel((prev) => !prev)} disabled={!canEditBoardStructure()}>
        {showSettingsPanel ? 'Close settings' : 'Settings'}
      </button>
      <button className={`actionPill ${compactMode ? 'actionPillPrimary' : ''}`} onClick={() => setCompactMode((prev) => !prev)}>
        {compactMode ? 'Compact: On' : 'Compact: Off'}
      </button>
    </div>
  );
}
