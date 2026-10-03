import crypto from 'node:crypto';

function json(res, status, body) {
  res.status(status)
    .setHeader('Content-Type', 'application/json')
    .setHeader('Access-Control-Allow-Origin', 'https://dzcore.top')
    .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(body));
}

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const apiKey = process.env.RESEND_API_KEY;
  const verificationSecret = process.env.VERIFICATION_SECRET;
  if (!apiKey || !verificationSecret) {
    return json(res, 503, { error: 'Email verification service is not configured yet.' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(res, 400, { error: 'Enter a valid email address.' });
  }

  const nonce = crypto.randomUUID();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ email, nonce, expiresAt })).toString('base64url');
  const token = `${payload}.${sign(payload, verificationSecret)}`;
  const codeDigest = crypto.createHmac('sha256', verificationSecret).update(`${email}:${nonce}`).digest('hex');
  const code = String(parseInt(codeDigest.slice(0, 12), 16) % 1000000).padStart(6, '0');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'DZCORE <onboarding@resend.dev>',
      to: [email],
      subject: 'DZCORE verification code',
      text: `Your DZCORE verification code is ${code}. It expires in 10 minutes.`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>DZCORE</h2><p>Your verification code is:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:12px 0">${code}</div><p>This code expires in 10 minutes.</p></div>`,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error('[Resend] send failed', response.status, details);
    return json(res, 502, { error: 'The email could not be sent. Check the Resend configuration.' });
  }

  return json(res, 200, { token, expiresAt });
}
