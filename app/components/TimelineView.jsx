'use client';

export default function TimelineView({
  timelineTasks,
  timelineRange,
  draggedTaskId,
  canEditDeals,
  setDraggedTaskId,
  openTask,
  moveTaskToTimelinePosition,
  toneClass,
  formatDate,
}) {
  return (
    <section className="panel timelineView">
      <div className="calendarViewHeader">
        <div>
          <div className="panelTitle">Timeline</div>
          <div className="smallMuted">Track live delivery windows across due-dated deals.</div>
        </div>
        <div className="timelineSummary">
          <span className="miniPill">{timelineTasks.length} scheduled deals</span>
          <span className="miniPill">{timelineRange.totalDays} day range</span>
        </div>
      </div>
      <div className="timelineList">
        {timelineTasks.length === 0 ? (
          <div className="emptyState emptyStateInline">Add due dates to see a timeline.</div>
        ) : (
          <>
            <div className="timelineScale">
              {timelineRange.markers.map((marker) => (
                <span key={marker.label} className="timelineScaleMarker" style={{ left: marker.left }}>{marker.label}</span>
              ))}
            </div>
            {timelineTasks.map((task) => {
              const dueMs = new Date(`${task.due_date}T00:00:00`).getTime();
              const createdMs = task.created_at ? new Date(task.created_at).getTime() : (dueMs - (5 * 24 * 60 * 60 * 1000));
              const safeStartMs = Number.isNaN(createdMs) ? (dueMs - (5 * 24 * 60 * 60 * 1000)) : Math.min(createdMs, dueMs);
              const leftPercent = ((safeStartMs - timelineRange.startMs) / Math.max(timelineRange.endMs - timelineRange.startMs, 1)) * 100;
              const widthPercent = Math.max(8, ((dueMs - safeStartMs) / Math.max(timelineRange.endMs - timelineRange.startMs, 1)) * 100);
              return (
                <div
                  key={task.id}
                  className="timelineRow"
                  draggable={canEditDeals()}
                  onDragStart={() => setDraggedTaskId(task.id)}
                  onDragEnd={() => setDraggedTaskId(null)}
                  onClick={() => openTask(task)}
                >
                  <div className="timelineMeta">
                    <strong>{task.title}</strong>
                    <span>{`${task.assessor || 'Unassigned'} / ${task.status || 'Assigned'}`}</span>
                  </div>
                  <div
                    className={`timelineTrack ${draggedTaskId ? 'timelineTrackDropTarget' : ''}`}
                    onDragOver={(event) => {
                      if (!draggedTaskId || !canEditDeals()) return;
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      if (!draggedTaskId || !canEditDeals()) return;
                      const bounds = event.currentTarget.getBoundingClientRect();
                      moveTaskToTimelinePosition(draggedTaskId, event.clientX, bounds);
                    }}
                  >
                    <div className="timelineBarWrap" style={{ left: `${Math.max(0, leftPercent)}%`, width: `${Math.min(100 - Math.max(0, leftPercent), widthPercent)}%` }}>
                      <div className={`timelineBar ${toneClass('status', task.status)}`}>{task.priority || 'Medium'}</div>
                    </div>
                  </div>
                  <div className="timelineDate">{formatDate(task.due_date)}</div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}
