import {
  store, json, isDate, isTime, clean, normalizePhone, newRef, openSlots, getMenu, getOffers,
  priceBooking, lockRange, bookingFields, countCodeUse, readPeople,
} from '../lib/common.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
  let b;
  try { b = await req.json(); } catch { return json({ ok: false, error: 'Bad request' }, 400); }
  if (b.company) return json({ ok: true, ref: 'GN-OK' }); // honeypot: silently accept bots

  const name = clean(b.name, 80), phone = normalizePhone(b.phone);
  const date = clean(b.date, 10), time = clean(b.time, 5), notes = clean(b.notes, 600);
  if (!name) return json({ ok: false, error: 'Please enter your name.' }, 400);
  if (!phone) return json({ ok: false, error: 'Please enter a valid WhatsApp number.' }, 400);
  if (!isDate(date) || !isTime(time)) return json({ ok: false, error: 'Please choose a date and time.' }, 400);

  const s = store();
  const [menu, offers] = await Promise.all([getMenu(s), getOffers(s)]);
  const pq = priceBooking(menu, offers, readPeople(b, name), b.code);
  if (pq.error) return json({ ok: false, error: pq.error }, 400);
  if (b.code && pq.codeError && !pq.code) return json({ ok: false, error: pq.codeError, code: 'BADCODE' }, 400);

  const open = await openSlots(s);
  if (!open[date]?.includes(time)) return json({ ok: false, error: 'Sorry, that slot was just taken. Please pick another.', code: 'TAKEN', slots: open }, 409);

  const ref = newRef();
  const extra = await lockRange(s, ref, date, time, pq.mins); // atomic: only the first request for a slot wins
  if (extra === null) return json({ ok: false, error: 'Sorry, that slot was just taken. Please pick another.', code: 'TAKEN', slots: await openSlots(s) }, 409);

  const booking = { ref, name, phone, ...bookingFields(pq), extraSlots: extra.length ? extra : undefined, date, time, notes, status: 'pending', source: 'website', createdAt: new Date().toISOString() };
  await s.setJSON(`booking/${ref}`, booking);
  if (pq.code) await countCodeUse(s, pq.code.code);
  return json({ ok: true, ref, total: pq.total, discount: pq.discount, people: pq.people, undecided: pq.undecided });
};
export const config = { path: '/api/book' };
