const SESSION_COOKIE = 'dzcore_session';
const SESSION_DAYS = 30;

function json(data, status = 200, origin = '*', extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...extra,
    },
  });
}

function originFor(request) {
  const origin = request.headers.get('Origin');
  return origin && /^(https:\/\/)(dzcore\.pages\.dev|dzcore\.top)$/.test(origin) ? origin : 'https://dzcore.pages.dev';
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

function parseCookies(request) {
  return Object.fromEntries((request.headers.get('Cookie') || '').split(';').filter(Boolean).map((part) => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
}

function cookie(value, maxAge) {
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=None`;
}

function cleanUser(profile) {
  if (!profile) return null;
  const copy = { ...profile };
  delete copy.password;
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

async function createSession(userId, env) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_DAYS * 86400000;
  await env.DB.prepare('INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').bind(await digest(token), userId, expiresAt, Date.now()).run();
  return { token, expiresAt };
}

async function entityList(url, env) {
  const type = url.searchParams.get('type');
  const ownerId = url.searchParams.get('ownerId');
  let query = 'SELECT entity_type, entity_id, owner_id, payload, deleted FROM entities';
  const values = [];
  const clauses = [];
  if (type) { clauses.push('entity_type = ?'); values.push(type); }
  if (ownerId) { clauses.push('owner_id = ?'); values.push(ownerId); }
  if (clauses.length) query += ` WHERE ${clauses.join(' AND ')}`;
  query += ' ORDER BY updated_at DESC LIMIT 10000';
  const result = await env.DB.prepare(query).bind(...values).all();
  return result.results.filter((row) => !row.deleted).map((row) => ({ entityType: row.entity_type, entityId: row.entity_id, ownerId: row.owner_id, payload: row.payload }));
}

export default {
  async fetch(request, env) {
    const origin = originFor(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS' } });
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/health') return json({ ok: true, service: 'dzcore-cloudflare-api' }, 200, origin);
      if (url.pathname === '/api/auth/me' && request.method === 'GET') return json({ user: cleanUser(await currentUser(request, env)) }, 200, origin);
      if (url.pathname === '/api/auth/register' && request.method === 'POST') {
        const body = await request.json();
        const username = String(body.username || '').trim().toLowerCase();
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        if (!/^[a-z0-9_]{3,32}$/.test(username) || !email.includes('@') || password.length < 8) return json({ error: 'invalid_fields' }, 400, origin);
        const id = crypto.randomUUID();
        const profile = { id, username, displayName: String(body.displayName || username).trim(), email, avatar: body.avatar || '', banner: '', profileColor: '', displayNameColor: '', bio: '', status: 'online', customStatus: '', badges: ['Member'], karma: 0, joinedDate: new Date().toISOString(), followersCount: 0, followingCount: 0, isFollowing: false };
        try {
          await env.DB.prepare('INSERT INTO auth_users (id, username, email, password_hash, profile_json, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, username, email, await hashPassword(password), JSON.stringify(profile), Date.now()).run();
          await env.DB.prepare('INSERT INTO entities (entity_type, entity_id, owner_id, payload, updated_at, deleted) VALUES (?, ?, ?, ?, ?, 0)').bind('user', id, id, JSON.stringify(profile), Date.now()).run();
        } catch (error) {
          await env.DB.prepare('DELETE FROM auth_users WHERE id = ?').bind(id).run().catch(() => {});
          const message = String(error?.message || 'already_registered');
          return json({ error: message.includes('UNIQUE') ? 'already_registered' : 'registration_failed' }, message.includes('UNIQUE') ? 409 : 500, origin);
        }
        const session = await createSession(id, env);
        return json({ user: cleanUser(profile) }, 201, origin, { 'set-cookie': cookie(session.token, SESSION_DAYS * 86400) });
      }
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        const body = await request.json();
        const term = String(body.term || '').trim().toLowerCase();
        const row = await env.DB.prepare('SELECT id, username, email, password_hash, profile_json FROM auth_users WHERE lower(email) = ? OR lower(username) = ?').bind(term, term).first();
        if (!row || !(await verifyPassword(String(body.password || ''), row.password_hash))) return json({ error: 'invalid_credentials' }, 401, origin);
        const session = await createSession(row.id, env);
        const user = { ...JSON.parse(row.profile_json), id: row.id, username: row.username, email: row.email };
        return json({ user: cleanUser(user) }, 200, origin, { 'set-cookie': cookie(session.token, SESSION_DAYS * 86400) });
      }
      if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
        const token = parseCookies(request)[SESSION_COOKIE];
        if (token) await env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(await digest(token)).run();
        return json({ ok: true }, 200, origin, { 'set-cookie': cookie('', 0) });
      }
      if (url.pathname === '/api/auth/account' && request.method === 'PUT') {
        const user = await currentUser(request, env);
        if (!user) return json({ error: 'unauthorized' }, 401, origin);
        const body = await request.json();
        const row = await env.DB.prepare('SELECT password_hash, profile_json FROM auth_users WHERE id = ?').bind(user.id).first();
        if (!row || !(await verifyPassword(String(body.currentPassword || ''), row.password_hash))) return json({ error: 'invalid_current_password' }, 403, origin);
        const profile = { ...JSON.parse(row.profile_json) };
        const statements = [];
        if (body.email) { profile.email = String(body.email).trim().toLowerCase(); statements.push(env.DB.prepare('UPDATE auth_users SET email = ?, profile_json = ? WHERE id = ?').bind(profile.email, JSON.stringify(profile), user.id)); }
        if (body.newPassword) statements.push(env.DB.prepare('UPDATE auth_users SET password_hash = ? WHERE id = ?').bind(await hashPassword(String(body.newPassword)), user.id));
        if (!statements.length) return json({ error: 'nothing_to_update' }, 400, origin);
        await env.DB.batch(statements);
        return json({ user: cleanUser({ ...profile, id: user.id, username: user.username, email: profile.email || user.email }) }, 200, origin);
      }
      if (url.pathname === '/api/entities' && request.method === 'GET') return json({ items: await entityList(url, env) }, 200, origin);
      if (url.pathname === '/api/entities/batch' && request.method === 'POST') {
        const user = await currentUser(request, env);
        if (!user) return json({ error: 'unauthorized' }, 401, origin);
        const body = await request.json();
        const entities = Array.isArray(body.entities) ? body.entities : [];
        if (!entities.length || entities.length > 20 || entities.some((item) => item.entityType !== 'profileMedia' || !item.entityId || typeof item.payload !== 'string')) {
          return json({ error: 'invalid_entity_batch' }, 400, origin);
        }
        const statements = entities.map((item) => env.DB.prepare('INSERT INTO entities (entity_type, entity_id, owner_id, payload, updated_at, deleted) VALUES (?, ?, ?, ?, ?, 0) ON CONFLICT(entity_type, entity_id) DO UPDATE SET owner_id=excluded.owner_id, payload=excluded.payload, updated_at=excluded.updated_at, deleted=0').bind(item.entityType, item.entityId, item.ownerId || user.id, item.payload, Date.now()));
        await env.DB.batch(statements);
        return json({ ok: true }, 200, origin);
      }
      if (url.pathname === '/api/entities' && request.method === 'POST') {
        const user = await currentUser(request, env);
        if (!user) return json({ error: 'unauthorized' }, 401, origin);
        const body = await request.json();
        if (!body.entityType || !body.entityId || typeof body.payload !== 'string') return json({ error: 'invalid_entity' }, 400, origin);
        const ownerId = body.ownerId || user.id;
        await env.DB.prepare('INSERT INTO entities (entity_type, entity_id, owner_id, payload, updated_at, deleted) VALUES (?, ?, ?, ?, ?, 0) ON CONFLICT(entity_type, entity_id) DO UPDATE SET owner_id=excluded.owner_id, payload=excluded.payload, updated_at=excluded.updated_at, deleted=0').bind(body.entityType, body.entityId, ownerId, body.payload, Date.now()).run();
        if (body.entityType === 'user' && body.entityId === user.id) {
          const profile = JSON.parse(body.payload);
          await env.DB.prepare('UPDATE auth_users SET username = ?, email = ?, profile_json = ? WHERE id = ?').bind(profile.username, profile.email, body.payload, user.id).run();
        }
        return json({ ok: true }, 200, origin);
      }
      return json({ error: 'not_found' }, 404, origin);
    } catch (error) {
      console.error(error);
      return json({ error: 'server_error' }, 500, origin);
    }
  },
};
