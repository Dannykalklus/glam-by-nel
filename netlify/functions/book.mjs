import { store, json, isDate, isTime, slotKey, clean, normalizePhone, newRef, openSlots, getMenu, quote } from '../lib/common.mjs';

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
  const q = quote(await getMenu(s), clean(b.item, 80), Array.isArray(b.addons) ? b.addons.map(String) : []);
  if (!q) return json({ ok: false, error: 'Please choose a lash set (or "Not sure yet").' }, 400);

  const open = await openSlots(s);
  if (!open[date]?.includes(time)) return json({ ok: false, error: 'Sorry, that slot was just taken. Please pick another.', code: 'TAKEN', slots: open }, 409);

  const ref = newRef();
  // Atomic lock: only the first request for this slot succeeds
  const lock = await s.setJSON(slotKey(date, time), { ref }, { onlyIfNew: true });
  if (!lock.modified) return json({ ok: false, error: 'Sorry, that slot was just taken. Please pick another.', code: 'TAKEN', slots: await openSlots(s) }, 409);

  const booking = { ref, name, phone, ...q, date, time, notes, status: 'pending', source: 'website', createdAt: new Date().toISOString() };
  await s.setJSON(`booking/${ref}`, booking);
  return json({ ok: true, ref, total: q.total, set: q.set, undecided: !!q.undecided });
};
export const config = { path: '/api/book' };
