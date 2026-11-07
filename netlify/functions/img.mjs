import { store } from '../lib/common.mjs';

export default async (req, context) => {
  const id = String(context.params?.id || '').replace(/[^\w-]/g, '');
  const r = id && await store().getWithMetadata(`look/${id}`, { type: 'arrayBuffer' });
  if (!r) return new Response('Not found', { status: 404 });
  return new Response(r.data, { headers: { 'content-type': r.metadata?.type || 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' } });
};
export const config = { path: '/api/img/:id' };
