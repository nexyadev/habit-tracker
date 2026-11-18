import { clearSessionCookie } from '../_lib/session.js';

// POST /auth/logout
export async function onRequestPost() {
  return new Response(null, { status: 204, headers: { 'Set-Cookie': clearSessionCookie() } });
}
