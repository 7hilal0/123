const SESSION_COOKIE = 'dzcore_session';
const ADMIN_COOKIE = 'dzcore_admin';
const SESSION_DAYS = 30;

function json(data, status = 200, origin = '*', extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'content-type, x-dzcore-admin-secret',
      'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...extra,
    },
  });
}

const ALLOWED_ORIGINS = new Set(['https://dzcore.top', 'https://www.dzcore.top', 'https://dzcore.pages.dev', 'https://7hilal0.github.io', 'http://localhost:3000', 'http://localhost:5173']);
function originFor(request) {
  const origin = request.headers.get('Origin');
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://dzcore.top';
}
function originAllowed(request) {
  const origin = request.headers.get('Origin');
  return !origin || ALLOWED_ORIGINS.has(origin);
}
function csrfRequired(request) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && !originAllowed(request);
}

async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function toBase64(bytes) {
  let result = '';
  for (let index = 0; index < bytes.length; index += 0x8000) result += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(result);
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function hashPassword(password, salt = toBase64(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromBase64(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return `${salt}.${toBase64(new Uint8Array(bits))}`;
}

async function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split('.');
  if (!salt || !expected) return false;
  const actual = (await hashPassword(password, salt)).split('.')[1];
  return actual === expected;
}

let googleJwksCache = null;

function base64UrlToBytes(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function base64UrlToJson(value) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));
}

async function verifyGoogleCredential(token, clientId) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('invalid_google_token');
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = base64UrlToJson(encodedHeader);
  const claims = base64UrlToJson(encodedPayload);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('invalid_google_token');
  if (claims.iss !== 'https://accounts.google.com' && claims.iss !== 'accounts.google.com') throw new Error('invalid_google_issuer');
  if (claims.aud !== clientId) throw new Error('invalid_google_audience');
  if (!claims.sub || !claims.email || claims.email_verified !== true) throw new Error('unverified_google_account');
  if (!claims.exp || Number(claims.exp) * 1000 <= Date.now()) throw new Error('expired_google_token');

  const now = Date.now();
  if (!googleJwksCache || googleJwksCache.expiresAt <= now) {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    if (!response.ok) throw new Error('google_keys_unavailable');
    const cacheControl = response.headers.get('cache-control') || '';
    const match = cacheControl.match(/max-age=(\d+)/i);
    const maxAge = match ? Number(match[1]) : 3600;
    googleJwksCache = { keys: await response.json(), expiresAt: now + Math.min(Math.max(maxAge, 300), 86400) * 1000 };
  }
  const jwk = (googleJwksCache.keys.keys || []).find((key) => key.kid === header.kid);
  if (!jwk) { googleJwksCache = null; throw new Error('google_key_not_found'); }
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    base64UrlToBytes(encodedSignature),
    new TextEncoder().encode(encodedHeader + '.' + encodedPayload),
  );
  if (!valid) throw new Error('invalid_google_signature');
  return claims;
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.get('Cookie') || '').split(';').filter(Boolean).map((part) => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
}

function cookie(value, maxAge, name = SESSION_COOKIE) {
  return name + '=' + encodeURIComponent(value) + '; Max-Age=' + maxAge + '; Path=/; HttpOnly; Secure; SameSite=None';
}

function cleanUser(profile) {
  if (!profile) return null;
  const copy = { ...profile };
  delete copy.password;
  delete copy.password_hash;
  return copy;
}

async function currentUser(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const tokenHash = await digest(token);
  const session = await env.DB.prepare('SELECT user_id FROM auth_sessions WHERE token_hash = ? AND expires_at > ?').bind(tokenHash, Date.now()).first();
  if (!session) return null;
  const row = await env.DB.prepare('SELECT id, username, email, profile_json FROM auth_users WHERE id = ?').bind(session.user_id).first();
  if (!row) return null;
  return { ...JSON.parse(row.profile_json), id: row.id, username: row.username, email: row.email };
}

function adminKey(env) {
  return String(env.ADMIN_PANEL_KEY || '');
}

function isAdmin(request, env) {
  const headerSecret = request.headers.get('x-dzcore-admin-secret');
  return headerSecret === adminKey(env) || parseCookies(request)[ADMIN_COOKIE] === adminKey(env);
}

function adminRequired(request, env, origin) {
  return isAdmin(request, env) ? null : json({ error: 'admin_unauthorized' }, 401, origin);
}

async function createSession(userId, env) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_DAYS * 86400000;
  await env.DB.prepare('INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').bind(await digest(token), userId, expiresAt, Date.now()).run();
  return { token, expiresAt };
}

async function entityList(url, env, user = null) {
  const type = url.searchParams.get('type');
  const ownerId = url.searchParams.get('ownerId');
  const entityId = url.searchParams.get('entityId');
  const summary = url.searchParams.get('summary') === '1';
  const conversationId = url.searchParams.get('conversationId');
  const payloadSelect = summary && type === 'post'
    ? "json_set(json_remove(payload, '$.author.banner'), '$.author.avatar', CASE WHEN length(json_extract(payload, '$.author.avatar')) <= 200000 THEN json_extract(payload, '$.author.avatar') ELSE '' END, '$.mediaUrl', CASE WHEN length(json_extract(payload, '$.mediaUrl')) <= 950000 THEN json_extract(payload, '$.mediaUrl') ELSE '' END, '$.mediaDeferred', CASE WHEN length(json_extract(payload, '$.mediaUrl')) > 950000 THEN 1 ELSE 0 END, '$.commentCount', (SELECT COUNT(*) FROM entities AS comments WHERE comments.entity_type = 'comment' AND comments.deleted = 0 AND json_extract(comments.payload, '$.postId') = entities.entity_id)) AS payload"
    : 'payload';
  let query = `SELECT entity_type, entity_id, owner_id, ${payloadSelect}, deleted FROM entities`;
  const values = [];
  const clauses = [];
  if (type) { clauses.push('entity_type = ?'); values.push(type); }
  if (ownerId) { clauses.push('owner_id = ?'); values.push(ownerId); }
  if (entityId) { clauses.push('entity_id = ?'); values.push(entityId); }
  if (['notification', 'communityMember'].includes(type) && user) { clauses.push('owner_id = ?'); values.push(user.id); }
  if (type === 'message' && conversationId) { clauses.push("json_extract(payload, '$.conversationId') = ?"); values.push(conversationId); }
  if (clauses.length) query += ` WHERE ${clauses.join(' AND ')}`;
  // Keep public reads bounded. Large unbounded entity scans make D1 spend time
  // parsing thousands of JSON rows before the browser can render the feed.
  const requestedLimit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 60), 100));
  query += ' ORDER BY updated_at DESC LIMIT ' + requestedLimit;
  const result = await env.DB.prepare(query).bind(...values).all();
  const rows = result.results.filter((row) => !row.deleted);
  let smallAvatarRows = [];
  if (summary && type === 'post') {
    const authorIds = [...new Set(rows.map((row) => {
      try { return JSON.parse(row.payload)?.author?.id; } catch { return null; }
    }).filter(Boolean))];
    if (authorIds.length) {
      const marks = authorIds.map(() => '?').join(',');
      const media = await env.DB.prepare(`SELECT owner_id, payload, updated_at FROM entities WHERE entity_type = 'profileMedia' AND deleted = 0 AND json_extract(payload, '$.field') = 'avatar' AND owner_id IN (${marks}) ORDER BY owner_id, updated_at ASC`).bind(...authorIds).all();
      const groups = new Map();
      for (const row of media.results) {
        try {
          const item = JSON.parse(row.payload);
          const key = `${row.owner_id}:${item.mediaVersion || 'legacy'}`;
          const group = groups.get(key) || { ownerId: row.owner_id, items: [] };
          group.items.push(item);
          groups.set(key, group);
        } catch { /* ignore malformed media */ }
      }
      for (const group of groups.values()) {
        const total = group.items[0]?.total || 0;
        const indexes = new Set(group.items.map((item) => item.index));
        if (total > 0 && group.items.length === total && total <= 5 && [...Array(total).keys()].every((index) => indexes.has(index))) {
          smallAvatarRows.push(...group.items.map((item) => ({ owner_id: group.ownerId, payload: JSON.stringify(item) })));
        }
      }
    }
  }
  const avatars = new Map();
  for (const row of smallAvatarRows) {
    try {
      const media = JSON.parse(row.payload);
      if (media.field !== 'avatar') continue;
      const current = avatars.get(row.owner_id) || [];
      current.push(media);
      avatars.set(row.owner_id, current);
    } catch { /* ignore malformed media rows */ }
  }
  let visibleRows = rows;
  if (type === 'conversation' && user) {
    visibleRows = rows.filter((row) => {
      try { return Array.isArray(JSON.parse(row.payload).participantIds) && JSON.parse(row.payload).participantIds.includes(user.id); } catch { return false; }
    });
  }