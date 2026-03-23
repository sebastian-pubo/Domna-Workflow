'use client';

const ROLE_OPTIONS = ['Admin', 'Manager', 'QA', 'Assessor', 'Viewer'];

export default function AccountsSettingsSection({
  authUser,
  currentProfile,
  activeRoleName,
  signOutCurrentUser,
  authEmailDraft,
  setAuthEmailDraft,
  signInWithEmail,
  authStatusText,
  knownProfiles,
  membershipDraftUserId,
  setMembershipDraftUserId,
  availableMembershipProfiles,
  membershipDraftRole,
  setMembershipDraftRole,
  addBoardMembership,
  canEditBoardStructure,
  boardMemberships,
  profilesById,
  updateBoardMembershipRole,
  removeBoardMembership,
  inviteDraftEmail,
  setInviteDraftEmail,
  inviteDraftRole,
  setInviteDraftRole,
  createBoardInvite,
  boardInvites,
  acceptBoardInvite,
  copyInviteLink,
  revokeBoardInvite,
}) {
  return (
    <section className="settingsSection">
      <div className="panelTitle panelTitleSmall">Accounts & access</div>
      <div className="smallMuted">
        Invite people or send a login link first. Once they sign in at least once, they will appear here and can be assigned to this board.
      </div>
      {authUser ? (
        <>
          <div className="directoryCard">
            <div>
              <div className="scoreName">{currentProfile?.full_name || authUser.email || 'Signed in user'}</div>
              <div className="scoreMeta">{authUser.email}</div>
            </div>
            <div className="scoreMeta">Role: {activeRoleName}</div>
          </div>
          <button className="btn" onClick={signOutCurrentUser}>
            Sign out
          </button>
        </>
      ) : (
        <div className="directoryForm">
          <input
            className="input"
            value={authEmailDraft}
            onChange={(event) => setAuthEmailDraft(event.target.value)}
            placeholder="Email for magic link login"
          />
          <button className="btn" onClick={signInWithEmail}>
            Send login link
          </button>
        </div>
      )}
      {authStatusText ? <div className="smallMuted">{authStatusText}</div> : null}
      <div className="directoryCard">
        <div>
          <div className="scoreName">How access works</div>
          <div className="scoreMeta">1. Send a login link or create an invite. 2. They sign in once. 3. Assign them to this board below.</div>
        </div>
      </div>
      <div className="panelTitle panelTitleSmall">Signed-in users</div>
      {knownProfiles.length > 0 ? (
        <div className="directoryList">
          {knownProfiles.map((profile) => (
            <div className="directoryCard" key={profile.id}>
              <div>
                <div className="scoreName">{profile.full_name || profile.email || profile.id}</div>
                <div className="scoreMeta">{profile.email || 'No email'} · Global role: {profile.role_name || 'Viewer'}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="smallMuted">No one has signed in yet. After the first sign-in, users will appear here for membership assignment.</div>
      )}
      <div className="panelTitle panelTitleSmall">Board memberships</div>
      <div className="smallMuted">Assign signed-in users to this board with a board-specific role.</div>
      <div className="directoryForm">
        <select
          className="select"
          value={membershipDraftUserId}
          onChange={(event) => setMembershipDraftUserId(event.target.value)}
          disabled={availableMembershipProfiles.length === 0}
        >
          <option value="">{availableMembershipProfiles.length === 0 ? 'No available signed-in users' : 'Select signed-in user'}</option>
          {availableMembershipProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name || profile.email || profile.id}
            </option>
          ))}
        </select>
        <select className="select" value={membershipDraftRole} onChange={(event) => setMembershipDraftRole(event.target.value)}>
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <button
          className="btn"
          onClick={addBoardMembership}
          disabled={!canEditBoardStructure() || availableMembershipProfiles.length === 0 || !membershipDraftUserId}
        >
          Add member
        </button>
      </div>
      <div className="directoryList">
        {boardMemberships.length > 0 ? (
          boardMemberships.map((membership) => (
            <div className="directoryCard" key={membership.id}>
              <div>
                <div className="scoreName">{profilesById[membership.user_id]?.full_name || profilesById[membership.user_id]?.email || membership.user_id}</div>
                <div className="scoreMeta">{membership.role_name}</div>
              </div>
              <div className="memberActions">
                <select
                  className="select memberRoleSelect"
                  value={membership.role_name}
                  onChange={(event) => updateBoardMembershipRole(membership.id, event.target.value)}
                  disabled={!canEditBoardStructure()}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button className="textButton" onClick={() => removeBoardMembership(membership.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="smallMuted">No board members yet.</div>
        )}
      </div>
      <div className="panelTitle panelTitleSmall">Invites</div>
      <div className="smallMuted">Use invites for people who have not signed in yet.</div>
      <div className="directoryForm">
        <input className="input" value={inviteDraftEmail} onChange={(event) => setInviteDraftEmail(event.target.value)} placeholder="Invite by email" />
        <select className="select" value={inviteDraftRole} onChange={(event) => setInviteDraftRole(event.target.value)}>
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <button className="btn" onClick={createBoardInvite} disabled={!canEditBoardStructure()}>
          Create invite
        </button>
      </div>
      <div className="directoryList">
        {boardInvites.map((invite) => (
          <div className="directoryCard" key={invite.id}>
            <div>
              <div className="scoreName">{invite.email}</div>
              <div className="scoreMeta">{invite.role_name} · {invite.status}</div>
            </div>
            <div className="memberActions">
              {authUser && authUser.email?.trim().toLowerCase() === invite.email?.trim().toLowerCase() && invite.status !== 'accepted' ? (
                <button className="btn" onClick={() => acceptBoardInvite(invite)}>
                  Accept invite
                </button>
              ) : null}
              <button className="textButton" onClick={() => copyInviteLink(invite)}>
                Copy link
              </button>
              <button className="textButton" onClick={() => revokeBoardInvite(invite.id)}>
                Revoke
              </button>
            </div>
          </div>
        ))}
        {boardInvites.length === 0 ? <div className="smallMuted">No pending invites for this board.</div> : null}
      </div>
    </section>
  );
}
