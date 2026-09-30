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

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export default function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const secret = process.env.VERIFICATION_SECRET;
  if (!secret) return json(res, 503, { error: 'Email verification service is not configured yet.' });

  const code = String(req.body?.code || '').trim();
  const token = String(req.body?.token || '');
  const parts = token.split('.');
  if (parts.length !== 2 || !/^\d{4}$/.test(code)) {
    return json(res, 400, { error: 'Enter the four-digit code.' });
  }

  const [payload, signature] = parts;
  if (!safeEqual(signature, sign(payload, secret))) {
    return json(res, 400, { error: 'This verification request is invalid or expired.' });
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.email || Date.now() > Number(data.expiresAt) || !safeEqual(String(data.code), code)) {
      return json(res, 400, { error: 'The code is incorrect or expired.' });
    }
    return json(res, 200, { verified: true, email: data.email });
  } catch {
    return json(res, 400, { error: 'This verification request is invalid.' });
  }
}
