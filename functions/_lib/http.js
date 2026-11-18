import { getUser } from './session.js';

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

export const err = (message, status = 400) => json({ error: message }, status);

/** Envolve um handler exigindo autenticação; injeta context.user. */
export function authed(handler) {
  return async (context) => {
    const user = await getUser(context);
    if (!user) return err('Não autenticado', 401);
    context.user = user;
    return handler(context);
  };
}

export async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}
