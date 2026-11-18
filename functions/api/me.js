import { getUser } from '../_lib/session.js';
import { json } from '../_lib/http.js';

// GET /api/me -> { user } ou 401
export async function onRequestGet(context) {
  const user = await getUser(context);
  if (!user) return json({ error: 'Não autenticado' }, 401);
  return json({ user });
}
