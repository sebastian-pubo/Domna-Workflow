'use client';

export default function CalendarView({
  calendarSummary,
  calendarGroups,
  draggedTaskId,
  canEditDeals,
  moveTaskToCalendarDate,
  setDraggedTaskId,
  formatDate,
  toneClass,
  updateTaskFieldInline,
  addDaysToDateString,
  openTask,
}) {
  return (
    <section className="panel calendarView">
      <div className="calendarViewHeader">
        <div>
          <div className="panelTitle">Calendar</div>
          <div className="smallMuted">Review due dates, overdue work, and the next delivery week.</div>
        </div>
        <div className="calendarSummary">
          <div className="miniStatCard">
            <span className="miniStatLabel">Overdue</span>
            <strong>{calendarSummary.overdue}</strong>
          </div>
          <div className="miniStatCard">
            <span className="miniStatLabel">Due today</span>
            <strong>{calendarSummary.today}</strong>
          </div>
          <div className="miniStatCard">
            <span className="miniStatLabel">This week</span>
            <strong>{calendarSummary.thisWeek}</strong>
          </div>
          <div className="miniStatCard">
            <span className="miniStatLabel">No due date</span>
            <strong>{calendarSummary.noDueDate}</strong>
          </div>
        </div>
      </div>
      <div className="calendarGrid">
        {calendarGroups.map(([date, dateTasks]) => (
          <div
            key={date}
            className={`calendarDay ${draggedTaskId ? 'calendarDayDropTarget' : ''}`}
            onDragOver={(event) => {
              if (!draggedTaskId || !canEditDeals()) return;
              event.preventDefault();
            }}
            onDrop={() => {
              if (!draggedTaskId || !canEditDeals()) return;
              moveTaskToCalendarDate(draggedTaskId, date);
            }}
          >
            <div className="calendarDayHeader">
              <div>{date === 'No due date' ? date : formatDate(date)}</div>
              <span className="miniPill">{dateTasks.length} deals</span>
            </div>
            <div className="calendarDayList">
              {dateTasks.map((task) => (
                <div
                  key={task.id}
                  className="calendarCard"
                  draggable={canEditDeals()}
                  onDragStart={() => setDraggedTaskId(task.id)}
                  onDragEnd={() => setDraggedTaskId(null)}
                >
                  <div className="calendarCardTop">
                    <strong>{task.title}</strong>
                    <span className={`pill ${toneClass('priority', task.priority)}`}>{task.priority || 'Medium'}</span>
                  </div>
                  <div className="calendarCardMeta">
                    <span className={`pill ${toneClass('status', task.status)}`}>{task.status || 'Assigned'}</span>
                    <span className="miniPill">{task.assessor || 'Unassigned'}</span>
                  </div>
                  <div className="smallMuted">{`${(task.attachments || []).length} files / ${(task.issues || []).length} issues / QA ${task.qa_status || 'Pending'}`}</div>
                  <div className="calendarCardActions">
                    <div className="calendarDateEditor">
                      <button type="button" className="miniButton" onClick={() => updateTaskFieldInline(task.id, 'due_date', addDaysToDateString(task.due_date, -1))} disabled={!canEditDeals()}>-1d</button>
                      <input className="cellInput calendarDateInput" type="date" value={task.due_date || ''} onChange={(event) => updateTaskFieldInline(task.id, 'due_date', event.target.value)} disabled={!canEditDeals()} />
                      <button type="button" className="miniButton" onClick={() => updateTaskFieldInline(task.id, 'due_date', addDaysToDateString(task.due_date, 1))} disabled={!canEditDeals()}>+1d</button>
                    </div>
                    <button type="button" className="miniButton" onClick={() => openTask(task)}>Open</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
