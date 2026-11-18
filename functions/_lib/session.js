// Sessão por cookie assinado com HMAC-SHA256 (WebCrypto). Sem estado no servidor.

const enc = new TextEncoder();
const COOKIE = 'ht_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

function b64url(buf) {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

async function key(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function sign(payload, secret) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await key(secret), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

export async function verify(token, secret) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  try {
    const ok = await crypto.subtle.verify('HMAC', await key(secret), b64urlDecode(sig), enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseCookies(request) {
  const out = {};
  for (const part of (request.headers.get('Cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

export function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export async function createSessionCookie(userId, secret) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return cookie(COOKIE, await sign({ uid: userId, exp }, secret), MAX_AGE);
}

export function clearSessionCookie() {
  return cookie(COOKIE, '', 0);
}

/** Retorna o usuário autenticado (linha do D1) ou null. */
export async function getUser(context) {
  const { request, env } = context;
  if (!env.SESSION_SECRET) return null;
  const token = parseCookies(request)[COOKIE];
  const payload = await verify(token, env.SESSION_SECRET);
  if (!payload) return null;
  return env.DB.prepare('SELECT id, username, avatar FROM users WHERE id = ?').bind(payload.uid).first();
}
