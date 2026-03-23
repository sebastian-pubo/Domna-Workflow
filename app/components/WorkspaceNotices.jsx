'use client';

export default function WorkspaceNotices({
  isSupabaseConfigured,
  errorText,
  inviteTokenFromUrl,
  inviteTokenMatch,
  boards,
  authUser,
  acceptBoardInvite,
}) {
  const invitedBoardName = inviteTokenMatch
    ? boards.find((board) => board.id === inviteTokenMatch.board_id)?.name || 'this board'
    : 'this board';

  return (
    <>
      {!isSupabaseConfigured && (
        <div className="notice">
          <strong>Demo mode is active.</strong>
          Add your Supabase URL and anon key in <code>.env.local</code> to switch this app to live board data.
        </div>
      )}

      {errorText && (
        <div className="notice noticeWarm">
          <strong>Data note</strong>
          {errorText}
        </div>
      )}

      {inviteTokenFromUrl && inviteTokenMatch && (
        <div className="notice">
          <strong>Invite ready.</strong>
          {` ${inviteTokenMatch.email} can join ${invitedBoardName} as ${inviteTokenMatch.role_name}. `}
          {!authUser ? (
            <span>Sign in with that email to accept it.</span>
          ) : authUser.email?.trim().toLowerCase() === inviteTokenMatch.email?.trim().toLowerCase() ? (
            <button className="btn btnInline" onClick={() => acceptBoardInvite(inviteTokenMatch)}>
              Accept invite
            </button>
          ) : (
            <span>Sign in with the invited email to accept it.</span>
          )}
        </div>
      )}
    </>
  );
}
