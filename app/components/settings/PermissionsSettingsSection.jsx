'use client';

const ROLE_OPTIONS = ['Admin', 'Manager', 'QA', 'Assessor', 'Viewer'];

export default function PermissionsSettingsSection({
  authUser,
  activeRoleName,
  currentRole,
  setCurrentRole,
  permissionSummary,
  boardPermissions,
  updateBoardPermission,
  canEditBoardStructure,
}) {
  return (
    <section className="settingsSection settingsSectionWide">
      <div className="panelTitle panelTitleSmall">Permissions</div>
      <div className="smallMuted">
        Switch role to preview access, then edit each board role below to control who can manage structure, update deals, or remove them.
      </div>
      <select className="select" value={authUser ? activeRoleName : currentRole} onChange={(event) => setCurrentRole(event.target.value)} disabled={Boolean(authUser)}>
        {ROLE_OPTIONS.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <div className="permissionRuleList">
        <div className={`permissionRule ${permissionSummary.canManageStructure ? 'enabled' : 'disabled'}`}>Manage board structure</div>
        <div className={`permissionRule ${permissionSummary.canEditDeals ? 'enabled' : 'disabled'}`}>Edit deals and updates</div>
        <div className={`permissionRule ${permissionSummary.canDeleteDeals ? 'enabled' : 'disabled'}`}>Archive and delete deals</div>
      </div>
      <div className="permissionMatrix">
        <div className="permissionMatrixHeader">Board role rules</div>
        <div className="permissionMatrixColumns">
          <div>Role</div>
          <div>Manage structure</div>
          <div>Edit deals</div>
          <div>Archive or delete</div>
        </div>
        {boardPermissions.map((permission) => (
          <div key={permission.role_name} className="permissionMatrixRow">
            <div className="permissionMatrixRole">
              <div className="permissionMatrixRoleName">{permission.role_name}</div>
              <div className="smallMuted">{permission.role_name === activeRoleName ? 'Current active role' : 'Board role'}</div>
            </div>
            <label className="permissionToggle">
              <input
                type="checkbox"
                checked={Boolean(permission.can_manage_structure)}
                onChange={(event) => updateBoardPermission(permission.role_name, { can_manage_structure: event.target.checked })}
                disabled={!canEditBoardStructure()}
              />
              <span>Structure</span>
            </label>
            <label className="permissionToggle">
              <input
                type="checkbox"
                checked={Boolean(permission.can_edit_deals)}
                onChange={(event) => updateBoardPermission(permission.role_name, { can_edit_deals: event.target.checked })}
                disabled={!canEditBoardStructure()}
              />
              <span>Edit deals</span>
            </label>
            <label className="permissionToggle">
              <input
                type="checkbox"
                checked={Boolean(permission.can_delete_deals)}
                onChange={(event) => updateBoardPermission(permission.role_name, { can_delete_deals: event.target.checked })}
                disabled={!canEditBoardStructure()}
              />
              <span>Delete/archive</span>
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
