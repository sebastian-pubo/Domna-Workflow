'use client';

export default function KanbanView({
  displayedGroups,
  groupBy,
  draggedTaskId,
  moveTaskBefore,
  setDraggedTaskId,
  openTask,
  toneClass,
  formatDate,
}) {
  return (
    <div className="kanbanBoard">
      {displayedGroups.map((group) => (
        <section
          key={group.id}
          className="kanbanColumn"
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
          </div>
          <div className="kanbanList">
            {group.tasks.length === 0 ? (
              <div className="emptyState emptyStateInline">No deals in this group.</div>
            ) : (
              group.tasks.map((task) => (
                <button
                  key={task.id}
                  className="kanbanCard"
                  draggable={groupBy === 'stage'}
                  onDragStart={() => setDraggedTaskId(task.id)}
                  onDragEnd={() => setDraggedTaskId(null)}
                  onClick={() => openTask(task)}
                >
                  <div className="kanbanTitle">{task.title}</div>
                  <div className="kanbanMeta">
                    <span className={`pill ${toneClass('priority', task.priority)}`}>{task.priority || 'Medium'}</span>
                    <span className="pill">{task.assessor || 'Unassigned'}</span>
                  </div>
                  <div className="smallMuted">{task.due_date ? formatDate(task.due_date) : 'No due date'}</div>
                </button>
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
