'use client';

export default function PermissionSummaryPanel({
  activeRoleName,
  authUser,
  permissionSummary,
}) {
  return (
    <section className="panel permissionPanel">
      <div className="permissionPanelMain">
        <div className="panelTitle panelTitleSmall">Current role: {activeRoleName}</div>
        <div className="smallMuted">
          {authUser
            ? 'This role comes from the signed-in account and board membership.'
            : 'Use this role preview to see what each team member can manage on this board.'}
        </div>
      </div>
      <div className="permissionBadges">
        <span className={`permissionBadge ${permissionSummary.canManageStructure ? 'enabled' : 'disabled'}`}>
          Board setup {permissionSummary.canManageStructure ? 'on' : 'off'}
        </span>
        <span className={`permissionBadge ${permissionSummary.canEditDeals ? 'enabled' : 'disabled'}`}>
          Deal editing {permissionSummary.canEditDeals ? 'on' : 'off'}
        </span>
        <span className={`permissionBadge ${permissionSummary.canDeleteDeals ? 'enabled' : 'disabled'}`}>
          Delete/archive {permissionSummary.canDeleteDeals ? 'on' : 'off'}
        </span>
      </div>
    </section>
  );
}
