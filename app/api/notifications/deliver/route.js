const RESEND_API_URL = 'https://api.resend.com/emails';

function normalizeWhatsappTarget(target) {
  if (!target) return '';
  const trimmed = String(target).trim();
  if (!trimmed) return '';
  return trimmed.startsWith('whatsapp:') ? trimmed : `whatsapp:${trimmed}`;
}

async function deliverByWebhook(channel, payload) {
  if (!channel?.deliveryUrl) {
    return { ok: false, skipped: true, reason: 'missing_webhook' };
  }

  const response = await fetch(channel.deliveryUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return {
    ok: response.ok,
    status: response.status,
    provider: 'webhook',
  };
}

async function deliverByResend(channel, payload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from || channel.type !== 'email') {
    return { ok: false, skipped: true, reason: 'resend_not_configured' };
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [channel.target],
      subject: payload.title,
      text: [payload.title, payload.body, payload.linkUrl].filter(Boolean).join('\n\n'),
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    provider: 'resend',
  };
}

async function deliverByTwilio(channel, payload) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!accountSid || !authToken || !from || channel.type !== 'whatsapp') {
    return { ok: false, skipped: true, reason: 'twilio_not_configured' };
  }

  const body = new URLSearchParams({
    From: normalizeWhatsappTarget(from),
    To: normalizeWhatsappTarget(channel.target),
    Body: [payload.title, payload.body, payload.linkUrl].filter(Boolean).join('\n\n'),
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  return {
    ok: response.ok,
    status: response.status,
    provider: 'twilio',
  };
}

async function deliverChannel(channel, payload) {
  if (!channel?.enabled) {
    return { id: channel?.id, ok: false, skipped: true, reason: 'disabled' };
  }

  try {
    let result = await deliverByWebhook(channel, payload);
    if (result.ok) {
      return { id: channel.id, ...result };
    }
    if (result.reason !== 'missing_webhook') {
      return { id: channel.id, ...result };
    }

    if (channel.type === 'email') {
      result = await deliverByResend(channel, payload);
      return { id: channel.id, ...result };
    }

    if (channel.type === 'whatsapp') {
      result = await deliverByTwilio(channel, payload);
      return { id: channel.id, ...result };
    }

    return { id: channel.id, ok: false, skipped: true, reason: 'unsupported_channel_type' };
  } catch (error) {
    return {
      id: channel?.id,
      ok: false,
      error: error.message,
    };
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const channels = Array.isArray(body?.channels) ? body.channels : [];
    const notification = body?.notification || {};
    const boardName = body?.boardName || 'Board';

    const payload = {
      boardName,
      channelType: notification.channelType || '',
      target: notification.target || '',
      title: notification.title,
      body: notification.body,
      type: notification.type || 'info',
      createdAt: notification.created_at || new Date().toISOString(),
      linkUrl: notification.linkUrl || '',
    };

    const enabledChannels = channels.filter((channel) => channel?.enabled && channel?.target);
    if (enabledChannels.length === 0) {
      return Response.json({ ok: true, delivered: 0, results: [] });
    }

    const results = await Promise.all(enabledChannels.map((channel) => deliverChannel(channel, payload)));

    return Response.json({
      ok: results.every((result) => result.ok || result.skipped),
      delivered: results.filter((result) => result.ok).length,
      results,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 400 });
  }
}
