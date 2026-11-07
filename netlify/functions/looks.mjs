import { store, json } from '../lib/common.mjs';

export default async () => {
  const s = store();
  const [looks, guide] = await Promise.all([s.get('looks', { type: 'json' }), s.get('guide', { type: 'json' })]);
  return json({ ok: true, looks: looks || [], guide: guide || {} }, 200, { 'cache-control': 'public, max-age=60' });
};
export const config = { path: '/api/looks' };
