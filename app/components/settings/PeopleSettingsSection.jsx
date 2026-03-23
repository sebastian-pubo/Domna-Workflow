'use client';

export default function PeopleSettingsSection({
  assessorDraftName,
  setAssessorDraftName,
  assessorDraftRole,
  setAssessorDraftRole,
  addAssessor,
  canEditBoardStructure,
  assessorDirectory,
  pendingAssessorArchiveId,
  setPendingAssessorArchiveId,
  pendingAssessorDeleteId,
  setPendingAssessorDeleteId,
  removeAssessor,
  deleteAssessorPermanently,
}) {
  return (
    <section className="settingsSection">
      <div className="panelTitle panelTitleSmall">People</div>
      <div className="directoryForm">
        <input
          className="input"
          value={assessorDraftName}
          onChange={(event) => setAssessorDraftName(event.target.value)}
          placeholder="Add assessor name"
        />
        <select className="select" value={assessorDraftRole} onChange={(event) => setAssessorDraftRole(event.target.value)}>
          <option value="Assessor">Assessor</option>
          <option value="QA">QA</option>
          <option value="Manager">Manager</option>
          <option value="Support">Support</option>
        </select>
        <button className="btn" onClick={addAssessor} disabled={!canEditBoardStructure()}>
          Add
        </button>
      </div>
      <div className="directoryList">
        {assessorDirectory.map((assessor) => (
          <div className="directoryCard" key={assessor.id}>
            <div>
              <div className="scoreName">{assessor.name}</div>
              <div className="scoreMeta">{assessor.role}</div>
            </div>
            {assessor.name !== 'Unassigned' && (
              pendingAssessorArchiveId === assessor.id ? (
                <div className="columnCardActions">
                  <button className="btn btnDanger" onClick={() => removeAssessor(assessor.name)}>
                    Archive
                  </button>
                  <button className="btn" onClick={() => setPendingAssessorArchiveId(null)}>
                    Cancel
                  </button>
                </div>
              ) : pendingAssessorDeleteId === assessor.id ? (
                <div className="columnCardActions">
                  <button className="btn btnDanger" onClick={() => deleteAssessorPermanently(assessor.id, assessor.name)}>
                    Delete
                  </button>
                  <button className="btn" onClick={() => setPendingAssessorDeleteId(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="columnCardActions">
                  <button className="textButton" onClick={() => {
                    setPendingAssessorDeleteId(null);
                    setPendingAssessorArchiveId(assessor.id);
                  }}>
                    Archive
                  </button>
                  <button className="textButton" onClick={() => {
                    setPendingAssessorArchiveId(null);
                    setPendingAssessorDeleteId(assessor.id);
                  }}>
                    Delete
                  </button>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
