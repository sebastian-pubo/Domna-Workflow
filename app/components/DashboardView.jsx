'use client';

export default function DashboardView({
  dashboardStats,
  stageOverview,
  openTask,
  formatDate,
  notificationSummary,
  boardNotifications,
  boardTasks,
  getTaskDependencies,
}) {
  return (
    <section className="dashboardView">
      <div className="statsGrid">
        <div className="statCard">
          <div className="statLabelInput dashboardLabel">Overdue deals</div>
          <div className="statValue">{dashboardStats.overdue}</div>
          <div className="statSub">Deals that have passed their due date</div>
        </div>
        <div className="statCard">
          <div className="statLabelInput dashboardLabel">QA attention</div>
          <div className="statValue">{dashboardStats.qaNeedsAttention}</div>
          <div className="statSub">Deals still open in QA or pending review</div>
        </div>
        <div className="statCard">
          <div className="statLabelInput dashboardLabel">Workload</div>
          <div className="statValue">{dashboardStats.workload.reduce((sum, entry) => sum + entry.count, 0)}</div>
          <div className="statSub">Assigned deals across this board</div>
        </div>
        <div className="statCard">
          <div className="statLabelInput dashboardLabel">Due this week</div>
          <div className="statValue">{dashboardStats.dueThisWeek}</div>
          <div className="statSub">Deals landing in the next 7 days</div>
        </div>
      </div>
      <div className="dashboardGrid">
        <section className="panel">
          <div className="panelTitle panelTitleSmall">Workload by assessor</div>
          <div className="dashboardList">
            {dashboardStats.workload.map((entry) => (
              <div key={entry.name} className="directoryCard">
                <div className="scoreName">{entry.name}</div>
                <div className="scoreValue">{entry.count}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panelTitle panelTitleSmall">Stage distribution</div>
          <div className="dashboardList">
            {stageOverview.map((entry) => (
              <div key={entry.id} className="directoryCard">
                <div className="scoreName">{entry.name}</div>
                <div className="scoreValue">{entry.count}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panelTitle panelTitleSmall">Upcoming deadlines</div>
          <div className="dashboardList">
            {dashboardStats.upcoming.length === 0 ? (
              <div className="smallMuted">No upcoming due dates yet.</div>
            ) : (
              dashboardStats.upcoming.map((task) => (
                <button key={task.id} className="dashboardRowButton" onClick={() => openTask(task)}>
                  <span>{task.title}</span>
                  <strong>{formatDate(task.due_date)}</strong>
                </button>
              ))
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panelTitle panelTitleSmall">QA queue</div>
          <div className="dashboardList">
            {dashboardStats.qaQueue.length === 0 ? (
              <div className="smallMuted">Nothing waiting on QA.</div>
            ) : (
              dashboardStats.qaQueue.map((task) => (
                <button key={task.id} className="dashboardRowButton" onClick={() => openTask(task)}>
                  <span>{task.title}</span>
                  <strong>{task.qa_status || 'Pending'}</strong>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
      <div className="dashboardGrid">
        <section className="panel">
          <div className="panelTitle panelTitleSmall">Workload chart</div>
          <div className="chartList">
            {dashboardStats.workload.length === 0 ? (
              <div className="smallMuted">No workload data yet.</div>
            ) : (
              dashboardStats.workload.map((entry) => {
                const maxCount = Math.max(...dashboardStats.workload.map((item) => item.count), 1);
                const width = entry.count <= 0 ? '0%' : `${Math.max(12, Math.round((entry.count / maxCount) * 100))}%`;
                return (
                  <div key={entry.name} className="chartRow">
                    <div className="chartLabel">{entry.name}</div>
                    <div className="chartTrack">
                      <div className="chartFill" style={{ width }} />
                    </div>
                    <div className="chartValue">{entry.count}</div>
                  </div>
                );
              })
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panelTitle panelTitleSmall">Stage chart</div>
          <div className="chartList">
            {stageOverview.map((entry) => {
              const maxCount = Math.max(...stageOverview.map((item) => item.count), 1);
              const width = entry.count <= 0 ? '0%' : `${Math.max(12, Math.round((entry.count / maxCount) * 100))}%`;
              return (
                <div key={entry.id} className="chartRow">
                  <div className="chartLabel">{entry.name}</div>
                  <div className="chartTrack">
                    <div className={`chartFill ${entry.tone}`} style={{ width }} />
                  </div>
                  <div className="chartValue">{entry.count}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <div className="dashboardGrid">
        <div className="statCard">
          <div className="statLabelInput dashboardLabel">High priority</div>
          <div className="statValue">{dashboardStats.highPriority}</div>
          <div className="statSub">Deals marked high priority</div>
        </div>
        <div className="statCard">
          <div className="statLabelInput dashboardLabel">Unassigned</div>
          <div className="statValue">{dashboardStats.unassigned}</div>
          <div className="statSub">Deals without an owner yet</div>
        </div>
        <div className="statCard">
          <div className="statLabelInput dashboardLabel">MagicPlan outstanding</div>
          <div className="statValue">{dashboardStats.magicplanOutstanding}</div>
          <div className="statSub">Deals still missing full MagicPlan coverage</div>
        </div>
        <div className="statCard">
          <div className="statLabelInput dashboardLabel">Tracked hours</div>
          <div className="statValue">{dashboardStats.trackedHours.toFixed(1)}</div>
          <div className="statSub">Hours captured through the built-in timer</div>
        </div>
        <div className="statCard">
          <div className="statLabelInput dashboardLabel">Blocked by dependency</div>
          <div className="statValue">{dashboardStats.blocked}</div>
          <div className="statSub">Deals waiting on linked work to finish</div>
        </div>
        <div className="statCard">
          <div className="statLabelInput dashboardLabel">Average progress</div>
          <div className="statValue">{dashboardStats.averageProgress}%</div>
          <div className="statSub">Average completion across progress columns</div>
        </div>
      </div>
      <div className="dashboardGrid">
        <div className="statCard">
          <div className="statLabelInput dashboardLabel">Recent notifications</div>
          <div className="permissionBadges notificationSummaryBadges">
            <span className={`permissionBadge ${notificationSummary.unread > 0 ? 'enabled' : 'disabled'}`}>Unread {notificationSummary.unread}</span>
            <span className={`permissionBadge ${notificationSummary.warnings > 0 ? 'enabled' : 'disabled'}`}>Warnings {notificationSummary.warnings}</span>
          </div>
          <div className="dashboardList">
            {boardNotifications.slice(0, 4).length === 0 ? (
              <div className="smallMuted">No recent notifications.</div>
            ) : (
              boardNotifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className="dashboardRowButton">
                  <strong>{notification.title}</strong>
                  <span>{notification.body}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="statCard">
          <div className="statLabelInput dashboardLabel">Dependency watch</div>
          <div className="dashboardList">
            {boardTasks.filter((task) => getTaskDependencies(task).length > 0).slice(0, 4).length === 0 ? (
              <div className="smallMuted">No linked deals yet.</div>
            ) : (
              boardTasks.filter((task) => getTaskDependencies(task).length > 0).slice(0, 4).map((task) => (
                <button key={task.id} className="dashboardRowButton" onClick={() => openTask(task)}>
                  <strong>{task.title}</strong>
                  <span>{getTaskDependencies(task).length} linked deal{getTaskDependencies(task).length === 1 ? '' : 's'}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
