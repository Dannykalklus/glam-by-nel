import { store, json, getMenu, getOffers, priceBooking, readPeople } from '../lib/common.mjs';

// Live price check for the booking form (promotions + discount code), nothing is saved.
export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
  let b;
  try { b = await req.json(); } catch { return json({ ok: false, error: 'Bad request' }, 400); }
  const s = store();
  const [menu, offers] = await Promise.all([getMenu(s), getOffers(s)]);
  const pq = priceBooking(menu, offers, readPeople(b, 'Client'), b.code);
  if (pq.error) return json({ ok: false, error: pq.error });
  return json({ ok: true, list: pq.list, promoOff: pq.promoOff, codeOff: pq.codeOff, discount: pq.discount, total: pq.total,
    undecided: pq.undecided, code: pq.code, codeError: pq.codeError, promos: pq.promoTitles, people: pq.people });
};
export const config = { path: '/api/quote' };
