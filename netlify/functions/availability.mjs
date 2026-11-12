import { openSlots, getSettings, getMenu, publicMenu, getOffers, livePromos, store, json } from '../lib/common.mjs';

// Public site data: open slots, studio details, current menu, live promotions and announcement banner
export default async () => {
  try {
    const s = store();
    const st = await getSettings(s);
    const [slots, menu, offers] = await Promise.all([openSlots(s, st), getMenu(s), getOffers(s)]);
    const promos = livePromos(offers).map(({ id, title, text, type, value, scope, targets, end, banner }) => ({ id, title, text, type, value, scope, targets, end, banner }));
    return json({
      ok: true, slots, menu: publicMenu(menu), promos,
      studio: { address: st.address, mapQuery: st.mapQuery, phone: st.phone, whatsapp: st.whatsapp },
      banner: st.banner?.on && st.banner.text ? st.banner.text : '',
    });
  } catch (e) { console.error(e); return json({ ok: false, error: 'Could not load availability' }, 500); }
};
export const config = { path: '/api/availability' };
