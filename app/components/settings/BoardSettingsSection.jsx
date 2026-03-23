'use client';

import { useState } from 'react';

export default function BoardSettingsSection({
  boardNameDraft,
  setBoardNameDraft,
  renameSelectedBoard,
  canEditBoardStructure,
  archiveSelectedBoard,
  deleteSelectedBoard,
  selectedBoardId,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <section className="settingsSection">
      <div className="panelTitle panelTitleSmall">Board</div>
      <div className="directoryForm">
        <input
          className="input"
          value={boardNameDraft}
          onChange={(event) => setBoardNameDraft(event.target.value)}
          placeholder="Rename current board"
        />
        <button className="btn" onClick={renameSelectedBoard} disabled={!canEditBoardStructure()}>
          Save board name
        </button>
      </div>
      <div className="directoryForm">
        <button className="btn" onClick={archiveSelectedBoard} disabled={!canEditBoardStructure() || !selectedBoardId}>
          Archive current board
        </button>
        {confirmingDelete ? (
          <>
            <button className="btn btnDanger" onClick={deleteSelectedBoard} disabled={!canEditBoardStructure() || !selectedBoardId}>
              Delete board
            </button>
            <button className="btn" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button className="btn" onClick={() => setConfirmingDelete(true)} disabled={!canEditBoardStructure() || !selectedBoardId}>
            Delete current board
          </button>
        )}
      </div>
      <div className="smallMuted">Columns are created from the board header so customization stays close to the work.</div>
    </section>
  );
}
