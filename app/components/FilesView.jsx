'use client';

export default function FilesView({
  allBoardAttachments,
  formatDateTime,
}) {
  return (
    <section className="panel filesView">
      <div className="panelTitle">Board files</div>
      {allBoardAttachments.length === 0 ? (
        <div className="emptyState">No files uploaded on this board yet.</div>
      ) : (
        <div className="filesGrid">
          {allBoardAttachments.map((attachment) => (
            <div key={attachment.id} className="attachmentCard">
              <div className="scoreName">{attachment.name}</div>
              <div className="attachmentMeta">{attachment.category || 'General'}</div>
              <div className="attachmentMeta">{attachment.taskTitle}</div>
              <div className="attachmentMeta">{attachment.groupName}</div>
              <div className="attachmentMeta">{Math.round((attachment.size || 0) / 1024)} KB / {formatDateTime(attachment.uploadedAt)}</div>
              {attachment.url && <a className="textButton" href={attachment.url} target="_blank" rel="noreferrer">Open file</a>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
