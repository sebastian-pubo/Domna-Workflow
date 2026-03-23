'use client';

export default function NotificationsPanel({
  createReminderSweep,
  markAllNotificationsRead,
  clearAllNotifications,
  notificationSummary,
  boardNotifications,
  formatDateTime,
  markNotificationRead,
}) {
  return (
    <section className="panel notificationsPanel">
      <div className="sectionHeader">
        <h3>Notifications</h3>
        <div className="notificationActions">
          <button className="btn" onClick={createReminderSweep}>
            Run reminder sweep
          </button>
          <button className="btn" onClick={markAllNotificationsRead}>
            Mark all read
          </button>
          <button className="textButton" onClick={clearAllNotifications}>
            Clear all
          </button>
        </div>
      </div>
      <div className="permissionBadges notificationSummaryBadges">
        <span className={`permissionBadge ${notificationSummary.unread > 0 ? 'enabled' : 'disabled'}`}>
          Unread {notificationSummary.unread}
        </span>
        <span className={`permissionBadge ${notificationSummary.warnings > 0 ? 'enabled' : 'disabled'}`}>
          Warnings {notificationSummary.warnings}
        </span>
        <span className={`permissionBadge ${notificationSummary.mentions > 0 ? 'enabled' : 'disabled'}`}>
          Mentions {notificationSummary.mentions}
        </span>
      </div>
      <div className="commentList">
        {boardNotifications.length === 0 ? (
          <div className="emptyState emptyStateInline">No notifications yet.</div>
        ) : (
          boardNotifications.map((notification) => (
            <button
              key={notification.id}
              className={`notificationCard ${notification.read ? 'read' : ''}`}
              onClick={() => markNotificationRead(notification.id)}
            >
              <div className="commentAuthor">{notification.title}</div>
              <div className="commentMeta">{formatDateTime(notification.created_at)}</div>
              <div className="commentText">{notification.body}</div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
