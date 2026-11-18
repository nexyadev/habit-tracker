import { cookie } from '../_lib/session.js';

// GET /auth/login -> redireciona ao Discord com `state` anti-CSRF
export async function onRequestGet({ request, env }) {
  if (!env.DISCORD_CLIENT_ID) return new Response('DISCORD_CLIENT_ID não configurado', { status: 500 });
  const url = new URL(request.url);
  const state = crypto.randomUUID();
  const redirect = `${url.origin}/auth/callback`;
  const auth = new URL('https://discord.com/oauth2/authorize');
  auth.searchParams.set('client_id', env.DISCORD_CLIENT_ID);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('redirect_uri', redirect);
  auth.searchParams.set('scope', 'identify');
  auth.searchParams.set('state', state);
  return new Response(null, {
    status: 302,
    headers: { Location: auth.toString(), 'Set-Cookie': cookie('ht_state', state, 600) },
  });
}
