import { openSlots, getSettings, getMenu, publicMenu, store, json } from '../lib/common.mjs';

// Public site data: open slots, studio details, current menu and announcement banner
export default async () => {
  try {
    const s = store();
    const st = await getSettings(s);
    const [slots, menu] = await Promise.all([openSlots(s, st), getMenu(s)]);
    return json({
      ok: true, slots, menu: publicMenu(menu),
      studio: { address: st.address, mapQuery: st.mapQuery },
      banner: st.banner?.on && st.banner.text ? st.banner.text : '',
    });
  } catch (e) { console.error(e); return json({ ok: false, error: 'Could not load availability' }, 500); }
};
export const config = { path: '/api/availability' };
