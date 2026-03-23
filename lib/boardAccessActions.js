import {
  appendBoardMapItem,
  prependBoardMapItem,
  removeBoardMapItem,
  replaceBoardMapItem,
} from './boardStateUtils';

export function createBoardAccessActions(deps) {
  const {
    canEditBoardStructure,
    selectedBoardId,
    selectedBoard,
    authUser,
    usingDemoMode,
    supabase,
    loadData,
    addNotification,
    makeNotification,
    setErrorText,
    setAuthStatusText,
    setInviteTokenFromUrl,
    channelDraftType,
    channelDraftLabel,
    channelDraftTarget,
    channelDraftUrl,
    setChannelDraftLabel,
    setChannelDraftTarget,
    setChannelDraftUrl,
    setNotificationChannelsByBoard,
    membershipDraftUserId,
    membershipDraftRole,
    setMembershipDraftUserId,
    setMembershipDraftRole,
    setBoardMembershipsByBoard,
    inviteDraftEmail,
    inviteDraftRole,
    setInviteDraftEmail,
    setInviteDraftRole,
    setBoardInvitesByBoard,
  } = deps;

  async function addNotificationChannel() {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    const target = channelDraftTarget.trim();
    const deliveryUrl = channelDraftUrl.trim();
    if (!target) return;
    const nextChannel = {
      id: `channel-${Date.now()}`,
      boardId: selectedBoardId,
      type: channelDraftType,
      label: channelDraftLabel.trim(),
      target,
      deliveryUrl,
      enabled: true,
    };

    setNotificationChannelsByBoard((prev) => appendBoardMapItem(prev, selectedBoardId, nextChannel));
    setChannelDraftLabel('');
    setChannelDraftTarget('');
    setChannelDraftUrl('');

    if (usingDemoMode || !supabase) return;
    const { data, error } = await supabase.from('notification_channels').insert({
      board_id: selectedBoardId,
      channel_type: channelDraftType,
      channel_label: nextChannel.label,
      target,
      delivery_url: deliveryUrl,
      enabled: true,
    }).select().single();
    if (error) {
      setErrorText(error.message);
      await loadData();
      return;
    }
    setNotificationChannelsByBoard((prev) => replaceBoardMapItem(prev, selectedBoardId, nextChannel.id, () => ({
      ...nextChannel,
      id: data.id,
      boardId: data.board_id,
      type: data.channel_type,
      label: data.channel_label || '',
      target: data.target,
      deliveryUrl: data.delivery_url || '',
      enabled: Boolean(data.enabled),
    })));
  }

  async function toggleNotificationChannel(channelId, enabled) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    setNotificationChannelsByBoard((prev) => replaceBoardMapItem(prev, selectedBoardId, channelId, (channel) => ({
      ...channel,
      enabled,
    })));
    if (usingDemoMode || !supabase) return;
    const { error } = await supabase.from('notification_channels').update({ enabled }).eq('id', channelId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function removeNotificationChannel(channelId) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    setNotificationChannelsByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, channelId));
    if (usingDemoMode || !supabase) return;
    const { error } = await supabase.from('notification_channels').delete().eq('id', channelId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function addBoardMembership() {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId || !membershipDraftUserId) return;

    const nextMembership = {
      id: `membership-${Date.now()}`,
      board_id: selectedBoardId,
      user_id: membershipDraftUserId,
      role_name: membershipDraftRole,
    };

    setBoardMembershipsByBoard((prev) => appendBoardMapItem(prev, selectedBoardId, nextMembership));
    setMembershipDraftUserId('');
    setMembershipDraftRole('Viewer');

    if (usingDemoMode || !supabase) return;
    const { data, error } = await supabase.from('board_memberships').upsert({
      board_id: selectedBoardId,
      user_id: membershipDraftUserId,
      role_name: membershipDraftRole,
    }, { onConflict: 'board_id,user_id' }).select().single();
    if (error) {
      setErrorText(error.message);
      await loadData();
      return;
    }
    setBoardMembershipsByBoard((prev) => replaceBoardMapItem(prev, selectedBoardId, nextMembership.id, () => data));
  }

  async function removeBoardMembership(membershipId) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    setBoardMembershipsByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, membershipId));
    if (usingDemoMode || !supabase) return;
    const { error } = await supabase.from('board_memberships').delete().eq('id', membershipId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function updateBoardMembershipRole(membershipId, roleName) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId || !membershipId) return;
    setBoardMembershipsByBoard((prev) => replaceBoardMapItem(prev, selectedBoardId, membershipId, (membership) => ({
      ...membership,
      role_name: roleName,
    })));
    if (usingDemoMode || !supabase) return;
    const { error } = await supabase.from('board_memberships').update({ role_name: roleName }).eq('id', membershipId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function createBoardInvite() {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId || !inviteDraftEmail.trim()) return;
    const invite = {
      id: `invite-${Date.now()}`,
      board_id: selectedBoardId,
      email: inviteDraftEmail.trim(),
      role_name: inviteDraftRole,
      invite_token: Math.random().toString(36).slice(2, 12),
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setBoardInvitesByBoard((prev) => prependBoardMapItem(prev, selectedBoardId, invite));
    setInviteDraftEmail('');
    setInviteDraftRole('Viewer');

    await addNotification({
      ...makeNotification('Board invite created', `${invite.email} was invited to ${selectedBoard?.name || 'this board'} as ${invite.role_name}.`, 'info'),
      dedupeKey: `invite:${invite.email}:${invite.role_name}`,
    });

    if (usingDemoMode || !supabase) return;
    const { data, error } = await supabase.from('board_invites').insert({
      board_id: selectedBoardId,
      email: invite.email,
      role_name: invite.role_name,
      invite_token: invite.invite_token,
      status: invite.status,
    }).select().single();
    if (error) {
      setErrorText(error.message);
      await loadData();
      return;
    }
    setBoardInvitesByBoard((prev) => replaceBoardMapItem(prev, selectedBoardId, invite.id, () => data));

    if (typeof window !== 'undefined') {
      const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${data.invite_token}`;
      fetch('/api/notifications/deliver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardName: selectedBoard?.name || 'Board',
          notification: {
            title: `You're invited to ${selectedBoard?.name || 'a board'}`,
            body: `You were invited as ${data.role_name}. Open the invite link to sign in and accept access.`,
            type: 'info',
            created_at: new Date().toISOString(),
            linkUrl: inviteUrl,
          },
          channels: [{
            id: `invite-email-${data.id}`,
            enabled: true,
            type: 'email',
            target: data.email,
            deliveryUrl: '',
          }],
        }),
      }).catch(() => {});
    }
  }

  async function revokeBoardInvite(inviteId) {
    if (!canEditBoardStructure()) return;
    if (!selectedBoardId) return;
    setBoardInvitesByBoard((prev) => removeBoardMapItem(prev, selectedBoardId, inviteId));
    if (usingDemoMode || !supabase) return;
    const { error } = await supabase.from('board_invites').delete().eq('id', inviteId);
    if (error) {
      setErrorText(error.message);
      await loadData();
    }
  }

  async function acceptBoardInvite(invite) {
    if (!authUser || !selectedBoardId || !invite) return;
    const authEmail = authUser.email?.trim().toLowerCase();
    const inviteEmail = invite.email?.trim().toLowerCase();
    if (!authEmail || authEmail !== inviteEmail) {
      setErrorText('Sign in with the invited email address to accept this invite.');
      return;
    }

    const optimisticMembership = {
      id: `membership-${Date.now()}`,
      board_id: selectedBoardId,
      user_id: authUser.id,
      role_name: invite.role_name || 'Viewer',
    };

    setBoardMembershipsByBoard((prev) => ({
      ...prev,
      [selectedBoardId]: [
        ...(prev[selectedBoardId] || []).filter((membership) => membership.user_id !== authUser.id),
        optimisticMembership,
      ],
    }));
    setBoardInvitesByBoard((prev) => replaceBoardMapItem(prev, selectedBoardId, invite.id, (item) => ({
      ...item,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })));

    await addNotification({
      ...makeNotification('Board invite accepted', `${invite.email} joined ${selectedBoard?.name || 'this board'} as ${invite.role_name}.`, 'success'),
      dedupeKey: `invite-accepted:${selectedBoardId}:${invite.email}`,
    });

    if (usingDemoMode || !supabase) return;

    const { data: membershipData, error: membershipError } = await supabase
      .from('board_memberships')
      .upsert(
        {
          board_id: selectedBoardId,
          user_id: authUser.id,
          role_name: invite.role_name || 'Viewer',
        },
        { onConflict: 'board_id,user_id' },
      )
      .select()
      .single();

    if (membershipError) {
      setErrorText(membershipError.message);
      await loadData();
      return;
    }

    const { error: inviteError } = await supabase
      .from('board_invites')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invite.id);

    if (inviteError) {
      setErrorText(inviteError.message);
      await loadData();
      return;
    }

    setBoardMembershipsByBoard((prev) => replaceBoardMapItem(prev, selectedBoardId, optimisticMembership.id, () => membershipData));

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('invite')) {
        params.delete('invite');
        const nextSearch = params.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`);
        setInviteTokenFromUrl('');
      }
    }
  }

  async function copyInviteLink(invite) {
    if (typeof window === 'undefined' || !invite?.invite_token) return;
    const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${invite.invite_token}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setAuthStatusText(`Invite link copied for ${invite.email}.`);
    } catch {
      setAuthStatusText(inviteUrl);
    }
  }

  return {
    addNotificationChannel,
    toggleNotificationChannel,
    removeNotificationChannel,
    addBoardMembership,
    removeBoardMembership,
    updateBoardMembershipRole,
    createBoardInvite,
    revokeBoardInvite,
    acceptBoardInvite,
    copyInviteLink,
  };
}
