import { cookie, createSessionCookie, parseCookies } from '../_lib/session.js';

// GET /auth/callback?code=...&state=...
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = parseCookies(request).ht_state;

  if (!code || !state || !savedState || state !== savedState) {
    return new Response('Estado OAuth inválido. Tente entrar novamente.', { status: 400 });
  }

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${url.origin}/auth/callback`,
    }),
  });
  if (!tokenRes.ok) return new Response('Falha ao trocar o código com o Discord.', { status: 502 });
  const { access_token } = await tokenRes.json();

  const meRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!meRes.ok) return new Response('Falha ao obter o perfil do Discord.', { status: 502 });
  const me = await meRes.json();

  const avatar = me.avatar
    ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(me.id) >> 22n) % 6n)}.png`;
  const username = me.global_name || me.username;

  await env.DB.prepare(
    `INSERT INTO users (id, username, avatar) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET username = excluded.username, avatar = excluded.avatar`
  ).bind(me.id, username, avatar).run();

  const headers = new Headers({ Location: '/' });
  headers.append('Set-Cookie', await createSessionCookie(me.id, env.SESSION_SECRET));
  headers.append('Set-Cookie', cookie('ht_state', '', 0));
  return new Response(null, { status: 302, headers });
}
