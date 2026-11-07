import { openSlots, getSettings, store, json } from '../lib/common.mjs';

export default async () => {
  try {
    const s = store();
    const [slots, st] = await Promise.all([openSlots(s), getSettings(s)]);
    return json({ ok: true, slots, studio: { address: st.address, mapQuery: st.mapQuery } });
  } catch (e) { console.error(e); return json({ ok: false, error: 'Could not load availability' }, 500); }
};
export const config = { path: '/api/availability' };
