'use client';

export default function ChannelsSettingsSection({
  channelDraftType,
  setChannelDraftType,
  channelDraftLabel,
  setChannelDraftLabel,
  channelDraftTarget,
  setChannelDraftTarget,
  channelDraftUrl,
  setChannelDraftUrl,
  addNotificationChannel,
  canEditBoardStructure,
  boardNotificationChannels,
  toggleNotificationChannel,
  removeNotificationChannel,
}) {
  return (
    <section className="settingsSection">
      <div className="panelTitle panelTitleSmall">Notification channels</div>
      <div className="smallMuted">Configure email or WhatsApp delivery. You can use a direct provider setup with server env keys, or your own webhook URL as a fallback.</div>
      <div className="directoryForm">
        <select className="select" value={channelDraftType} onChange={(event) => setChannelDraftType(event.target.value)}>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <input className="input" value={channelDraftLabel} onChange={(event) => setChannelDraftLabel(event.target.value)} placeholder="Channel label" />
        <input className="input" value={channelDraftTarget} onChange={(event) => setChannelDraftTarget(event.target.value)} placeholder={channelDraftType === 'email' ? 'team@domna.homes' : '+447...'} />
        <input className="input" value={channelDraftUrl} onChange={(event) => setChannelDraftUrl(event.target.value)} placeholder="Optional webhook URL override" />
        <button className="btn" onClick={addNotificationChannel} disabled={!canEditBoardStructure()}>Add channel</button>
      </div>
      <div className="directoryList">
        {boardNotificationChannels.length === 0 ? (
          <div className="smallMuted">No channels configured yet.</div>
        ) : (
          boardNotificationChannels.map((channel) => (
            <div className="directoryCard" key={channel.id}>
              <div>
                <div className="scoreName">{channel.label || channel.target}</div>
                <div className="scoreMeta">{channel.type} / {channel.target}</div>
                <div className="smallMuted">{channel.deliveryUrl || 'No webhook URL set'}</div>
              </div>
              <div className="columnCardActions">
                <button className="btn" onClick={() => toggleNotificationChannel(channel.id, !channel.enabled)}>
                  {channel.enabled ? 'Disable' : 'Enable'}
                </button>
                <button className="textButton" onClick={() => removeNotificationChannel(channel.id)}>Remove</button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
