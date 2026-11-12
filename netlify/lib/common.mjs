// Shared helpers for Glam By Nel functions
import { getStore } from '@netlify/blobs';
import { createHash, timingSafeEqual, randomBytes } from 'node:crypto';

export const LEVELS = ['Classic', 'Mini Hybrid', 'Hybrid', 'Volume', ''];
export const SHAPES = ['wispy', 'cateye', 'normal', 'none'];
export const TAGS = ['wispy', 'cateye', 'classic', 'hybrid', 'volume', 'other'];
export const GUIDE_KEYS = ['classic', 'hybrid', 'volume', 'wispy', 'cateye'];
export const UNDECIDED = '__undecided';
export const ADDON_ONLY = '__addons';

const it = (id, name, level, price, mins, desc) => ({ id, name, level, price, mins, desc, active: true });
export const DEFAULT_MENU = {
  categories: [
    { id: 'wispy', name: 'Wispy', sub: 'Sets', shape: 'wispy', items: [
      it('volume-wispy', 'Volume Wispy Set', 'Volume', 330, 180, 'Full, fluffy fans in spiky wispy layers. Maximum drama, still featherlight.'),
      it('hybrid-wispy', 'Hybrid Wispy Set', 'Hybrid', 215, 150, 'Classic and volume blended into textured wisps. The best of both.'),
      it('mini-hybrid-wispy', 'Mini Hybrid Wispy', 'Mini Hybrid', 195, 150, 'Soft wispy texture with a lighter touch of volume. Effortless flutter.'),
      it('classic-wispy', 'Classic Wispy', 'Classic', 180, 120, 'One-to-one lashes in mixed lengths for a natural, spiky wisp.'),
    ] },
    { id: 'cateye', name: 'Cat Eye', sub: 'Sets', shape: 'cateye', items: [
      it('volume-cateye', 'Volume Cat Eye Set', 'Volume', 300, 180, 'Lush volume fans that sweep long at the outer corner. Bold and lifted.'),
      it('hybrid-cateye', 'Hybrid Cat Eye Set', 'Hybrid', 210, 150, 'A textured, elongating flick with a balance of fullness and definition.'),
      it('mini-hybrid-cateye', 'Mini Hybrid Cat Eye Set', 'Mini Hybrid', 190, 150, 'A subtle feline lift with a whisper of volume.'),
      it('classic-cateye', 'Classic Cat Eye Set', 'Classic', 175, 120, 'Clean one-to-one lashes that build toward the corners for a natural lift.'),
    ] },
    { id: 'normal', name: 'Normal', sub: 'Sets', shape: 'normal', items: [
      it('normal-volume', 'Normal Volume Set', 'Volume', 280, 180, 'Even, balanced volume all across the lash line. Soft and full.'),
      it('normal-hybrid', 'Normal Hybrid Set', 'Hybrid', 200, 150, 'An even mix of classic and volume for everyday glam with texture.'),
      it('normal-mini-hybrid', 'Normal Mini Hybrid Set', 'Mini Hybrid', 180, 150, 'Light, even fullness that looks naturally yours, only better.'),
      it('normal-classic', 'Normal Classic Lash', 'Classic', 160, 120, 'The timeless one-to-one set. Defined, clean and polished.'),
    ] },
  ],
  addons: [
    { id: 'bottom', name: 'Bottom Lashes', price: 70, mins: 30, desc: 'Add definition to your lower lash line. Pairs beautifully with any set.', active: true },
  ],
};

export const DEFAULT_SETTINGS = {
  slots: ['08:00', '11:00', '14:00', '17:00'],
  leadHours: 2,
  address: 'Capitol Hill, Lord of Peace – Sowutuom, Accra',
  mapQuery: '5.6425759,-0.2904883', // Lord Of Peace School, Sowutuom
  banner: { on: false, text: '' },
  calToken: '',
  phone: '0593761476',        // call number shown on the website for clients not booking online
  whatsapp: '233593761476',   // WhatsApp number used for all website links (international format)
  templates: {
    confirm: "Hi {name}! 💕 Your appointment with Glam By Nel is CONFIRMED.\n\n💎 {set}\n📅 {date}\n⏰ {time}\n💰 {total}\n🔖 Ref: {ref}\n\n📍 {address}\nMap: {map}\n\nPlease come with clean, makeup-free lashes. See you soon! ✨",
    decline: "Hi {name}, thank you for choosing Glam By Nel 💕 Unfortunately {date} at {time} is no longer available. Here are my next open slots:\n{openings}\n\nReply with the one that suits you and I'll lock it in for you. ✨",
    reminder: "Hi {name}! ✨ Just a reminder of your Glam By Nel appointment tomorrow, {date} at {time} ({set}).\n\n📍 {address}\nMap: {map}\n\nPlease come with clean, makeup-free lashes. See you soon! 💕",
    reschedule: "Hi {name}! 💕 Your Glam By Nel appointment has been moved to {date} at {time} ({set}). Ref: {ref}. See you then! ✨",
    undecided: "Hi {name}! 💕 Thanks for booking with Glam By Nel for {date} at {time}. You weren't sure which set to go for, so let's choose together. Do you prefer a natural look, something fluffy and full, or a dramatic cat eye? Send me any inspo pictures too! ✨",
  },
};

export const mapUrl = (q) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
export const store = () => getStore({ name: 'glam-by-nel', consistency: 'strong' });

export const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra } });

export const todayAccra = () => new Date().toISOString().slice(0, 10); // Ghana is UTC+0 all year
export const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
export const isTime = (s) => /^\d{2}:\d{2}$/.test(s || '');
export const slotKey = (date, time) => `slot/${date}T${time.replace(':', '')}`;
export const clean = (s, n = 200) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, n);
const slug = (s) => clean(s, 60).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x';
const money = (n) => Math.max(0, Math.min(100000, Math.round(Number(n) || 0)));

export function normalizePhone(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10 && d.startsWith('0')) d = '233' + d.slice(1); // Ghana local format
  if (d.length === 9) d = '233' + d;
  return d.length >= 10 && d.length <= 15 ? d : null;
}

export function newRef() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'GN-' + [...randomBytes(5)].map((x) => a[x % a.length]).join('');
}
export const newToken = () => randomBytes(18).toString('base64url');

export async function getSettings(s = store()) {
  const v = await s.get('settings', { type: 'json' });
  return {
    ...DEFAULT_SETTINGS, ...(v || {}),
    banner: { ...DEFAULT_SETTINGS.banner, ...(v?.banner || {}) },
    templates: { ...DEFAULT_SETTINGS.templates, ...(v?.templates || {}) },
  };
}

/* ---------- menu ---------- */
export async function getMenu(s = store()) {
  return (await s.get('menu', { type: 'json' })) || DEFAULT_MENU;
}

/** Validate and normalise a menu sent from the dashboard. */
export function sanitizeMenu(m) {
  const seen = new Set();
  const uid = (base) => { let id = slug(base), i = 2; while (seen.has(id)) id = `${slug(base)}-${i++}`; seen.add(id); return id; };
  const cats = (Array.isArray(m?.categories) ? m.categories : []).slice(0, 12).map((c) => ({
    id: uid(c.id || c.name), name: clean(c.name, 30) || 'Untitled', sub: clean(c.sub, 20),
    shape: SHAPES.includes(c.shape) ? c.shape : 'normal',
    items: (Array.isArray(c.items) ? c.items : []).slice(0, 30).map((x) => ({
      id: uid(x.id || x.name), name: clean(x.name, 60) || 'Untitled', level: LEVELS.includes(x.level) ? x.level : '',
      price: money(x.price), mins: Math.max(15, Math.min(600, Math.round(+x.mins || 120))), desc: clean(x.desc, 240), active: x.active !== false,
    })),
  }));
  const addons = (Array.isArray(m?.addons) ? m.addons : []).slice(0, 12).map((x) => ({
    id: uid(x.id || x.name), name: clean(x.name, 60) || 'Add-on', price: money(x.price),
    mins: Math.max(0, Math.min(300, Math.round(+x.mins || 0))), desc: clean(x.desc, 240), active: x.active !== false,
  }));
  return { categories: cats, addons };
}

/** Public view: only active items/add-ons, empty categories dropped. */
export const publicMenu = (m) => ({
  categories: m.categories.map((c) => ({ ...c, items: c.items.filter((x) => x.active) })).filter((c) => c.items.length),
  addons: m.addons.filter((a) => a.active),
});

/** Work out set name, total and duration for a booking request. */
export function quote(menu, itemId, addonIds = [], { allowInactive = false } = {}) {
  const addons = menu.addons.filter((a) => (allowInactive || a.active) && addonIds.includes(a.id));
  const addSum = addons.reduce((t, a) => t + a.price, 0), addMins = addons.reduce((t, a) => t + (a.mins || 0), 0);
  const base = { addons: addons.map((a) => a.name), addonIds: addons.map((a) => a.id) };
  if (itemId === UNDECIDED) return { ...base, itemId, set: 'Undecided – help me choose', undecided: true, price: 0, total: addSum, mins: 150 + addMins };
  if (itemId === ADDON_ONLY) return addons.length ? { ...base, itemId, set: 'Add-ons only', price: 0, total: addSum, mins: Math.max(30, addMins) } : null;
  for (const c of menu.categories) for (const x of c.items) {
    if (x.id === itemId && (allowInactive || x.active)) return { ...base, itemId, set: x.name, category: c.name, price: x.price, total: x.price + addSum, mins: x.mins + addMins };
  }
  return null;
}

/* ---------- slots ---------- */
export async function takenSlots(s = store()) {
  const { blobs } = await s.list({ prefix: 'slot/' });
  return new Set(blobs.map((b) => b.key));
}

/** Open slots from today onward, minus taken ones and slots inside the lead time. */
export async function openSlots(s = store(), settings) {
  const [avail, taken, st] = await Promise.all([s.get('availability', { type: 'json' }), takenSlots(s), settings || getSettings(s)]);
  const out = {};
  const today = todayAccra();
  const cutoff = Date.now() + (st.leadHours || 0) * 3600e3;
  for (const [date, times] of Object.entries(avail || {}).sort()) {
    if (date < today) continue;
    const free = (times || []).filter((t) => !taken.has(slotKey(date, t)) && new Date(`${date}T${t}:00Z`).getTime() > cutoff).sort();
    if (free.length) out[date] = free;
  }
  return out;
}

export function isAdmin(req) {
  const want = process.env.ADMIN_PASSWORD;
  const got = req.headers.get('x-admin-key') || '';
  if (!want) return false;
  const h = (x) => createHash('sha256').update(x).digest();
  return timingSafeEqual(h(want), h(got));
}
export function sameSecret(a, b) {
  if (!a || !b) return false;
  const h = (x) => createHash('sha256').update(x).digest();
  return timingSafeEqual(h(a), h(b));
}

/* ---------- offers: discount codes + promotions ---------- */
export const MAX_PEOPLE = 5;
export const EMPTY_OFFERS = { codes: [], promos: [] };
export async function getOffers(s = store()) {
  const o = (await s.get('offers', { type: 'json' })) || EMPTY_OFFERS;
  return { codes: o.codes || [], promos: o.promos || [] };
}
const inWindow = (x, day) => (!x.start || day >= x.start) && (!x.end || day <= x.end);
export const livePromos = (offers, day = todayAccra()) => offers.promos.filter((p) => p.active && inWindow(p, day));

/** Validate a code's own rules (not its effect). Returns {code} or {error}. */
export function findCode(offers, raw, day = todayAccra()) {
  const c = String(raw || '').trim().toUpperCase();
  if (!c) return {};
  const code = offers.codes.find((x) => x.code === c);
  if (!code || !code.active) return { error: 'That discount code isn’t valid.' };
  if (code.start && day < code.start) return { error: 'That code isn’t active yet.' };
  if (code.end && day > code.end) return { error: 'That code has expired.' };
  if (code.maxUses && (code.used || 0) >= code.maxUses) return { error: 'That code has been fully used.' };
  return { code };
}

/** Best promotion for one menu item (applies to the set price, not add-ons). */
export function promoFor(promos, itemId, catId, price) {
  let best = null;
  for (const p of promos) {
    const hit = p.scope === 'all' || (p.scope === 'cat' && p.targets?.includes(catId)) || (p.scope === 'items' && p.targets?.includes(itemId));
    if (!hit) continue;
    const off = Math.min(price, p.type === 'pct' ? Math.round(price * p.value / 100) : p.value);
    if (off > 0 && (!best || off > best.off)) best = { off, title: p.title, id: p.id };
  }
  return best;
}

/**
 * Price a booking for 1–5 people.
 * people: [{ name, item, addons }]; the first person is the main client.
 * Promotions apply automatically to set prices. A discount code applies to the subtotal:
 * on top of promotions if the code allows stacking, otherwise whichever saves the client more.
 */
export function priceBooking(menu, offers, people, rawCode, { allowInactive = false, day = todayAccra(), countUse = false } = {}) {
  if (!Array.isArray(people) || !people.length) return { error: 'Please choose a lash set.' };
  if (people.length > MAX_PEOPLE) return { error: `Group bookings are up to ${MAX_PEOPLE} people.` };
  const promos = livePromos(offers, day);
  const persons = [];
  for (const [i, p] of people.entries()) {
    const q = quote(menu, clean(p.item, 80), Array.isArray(p.addons) ? p.addons.map(String) : [], { allowInactive });
    if (!q) return { error: people.length > 1 ? `Please choose a set for person ${i + 1}.` : 'Please choose a lash set (or "Not sure yet").' };
    const cat = menu.categories.find((c) => c.items.some((x) => x.id === q.itemId));
    const pr = q.undecided || q.itemId === ADDON_ONLY ? null : promoFor(promos, q.itemId, cat?.id, q.price);
    persons.push({ name: clean(p.name, 60) || (i ? `Guest ${i}` : ''), ...q, list: q.total, promoOff: pr?.off || 0, promo: pr?.title || '' });
  }
  const list = persons.reduce((t, p) => t + p.list, 0);
  const promoOff = persons.reduce((t, p) => t + p.promoOff, 0);
  let codeOff = 0, codeInfo = null, codeError = null, applied = 'none';
  const f = findCode(offers, rawCode, day);
  if (f.error) codeError = f.error;
  else if (f.code) {
    const c = f.code;
    const base = c.stack ? list - promoOff : list;
    if (c.minSpend && list < c.minSpend) codeError = `This code needs a spend of at least GHS ${c.minSpend}.`;
    else {
      codeOff = Math.min(base, c.type === 'pct' ? Math.round(base * c.value / 100) : c.value);
      codeInfo = { code: c.code, type: c.type, value: c.value };
    }
  }
  let discount;
  if (codeInfo && !f.code.stack && promoOff) { // not combinable: client gets the better of the two
    if (codeOff >= promoOff) { discount = codeOff; applied = 'code'; persons.forEach((p) => { p.promoOff = 0; p.promo = ''; }); }
    else { discount = promoOff; applied = 'promo'; codeInfo = null; codeOff = 0; codeError = 'Your sale price is already better than this code.'; }
  } else { discount = promoOff + codeOff; applied = codeInfo && promoOff ? 'both' : codeInfo ? 'code' : promoOff ? 'promo' : 'none'; }
  const undecided = persons.some((p) => p.undecided);
  return {
    persons, people: persons.length, list, promoOff: applied === 'code' ? 0 : promoOff, codeOff, discount,
    total: Math.max(0, list - discount), code: codeInfo, codeError, undecided,
    mins: persons.reduce((t, p) => t + p.mins, 0),
    promoTitles: [...new Set(persons.map((p) => p.promo).filter(Boolean))],
  };
}

/** Record that a code was used (best effort). */
export async function countCodeUse(s, code) {
  if (!code) return;
  const o = await getOffers(s);
  const c = o.codes.find((x) => x.code === code);
  if (c) { c.used = (c.used || 0) + 1; await s.setJSON('offers', o); }
}

/** Validate offers sent from the dashboard; keeps live usage counts. */
export function sanitizeOffers(o, current = EMPTY_OFFERS) {
  const d = (v) => (isDate(v) ? v : '');
  const used = Object.fromEntries((current.codes || []).map((c) => [c.code, c.used || 0]));
  const seen = new Set();
  const codes = (Array.isArray(o?.codes) ? o.codes : []).slice(0, 100).map((c) => ({
    code: clean(c.code, 24).toUpperCase().replace(/[^A-Z0-9_-]/g, ''), type: c.type === 'amt' ? 'amt' : 'pct',
    value: c.type === 'amt' ? money(c.value) : Math.max(0, Math.min(100, Math.round(+c.value || 0))),
    minSpend: money(c.minSpend), maxUses: Math.max(0, Math.round(+c.maxUses || 0)), start: d(c.start), end: d(c.end),
    stack: !!c.stack, active: c.active !== false, note: clean(c.note, 80),
  })).filter((c) => c.code && c.value > 0 && !seen.has(c.code) && seen.add(c.code)).map((c) => ({ ...c, used: used[c.code] || 0 }));
  const promos = (Array.isArray(o?.promos) ? o.promos : []).slice(0, 30).map((p, i) => ({
    id: clean(p.id, 40) || 'promo-' + Date.now().toString(36) + i, title: clean(p.title, 60) || 'Special offer', text: clean(p.text, 160),
    type: p.type === 'amt' ? 'amt' : 'pct', value: p.type === 'amt' ? money(p.value) : Math.max(0, Math.min(100, Math.round(+p.value || 0))),
    scope: ['all', 'cat', 'items'].includes(p.scope) ? p.scope : 'all',
    targets: (Array.isArray(p.targets) ? p.targets : []).map((t) => clean(t, 80)).slice(0, 60),
    start: d(p.start), end: d(p.end), active: p.active !== false, banner: p.banner !== false,
  })).filter((p) => p.value > 0);
  return { codes, promos };
}

/* ---------- slot ranges (group bookings block the following open slots too) ---------- */
export async function lockRange(s, ref, date, time, mins) {
  const k = slotKey(date, time);
  const r = await s.setJSON(k, { ref }, { onlyIfNew: true });
  if (!r.modified) { const cur = await s.get(k, { type: 'json' }); if (cur?.ref !== ref) return null; }
  const extra = [];
  if (mins > 180) { // long appointments: also hold open slots that start before this one would finish
    const avail = (await s.get('availability', { type: 'json' })) || {};
    const start = new Date(`${date}T${time}:00Z`).getTime(), end = start + mins * 60e3;
    for (const t of avail[date] || []) {
      const at = new Date(`${date}T${t}:00Z`).getTime();
      if (at > start && at < end) { const w = await s.setJSON(slotKey(date, t), { ref }, { onlyIfNew: true }); if (w.modified) extra.push(t); }
    }
  }
  return extra;
}
export async function releaseRange(s, bk) {
  for (const t of [bk.time, ...(bk.extraSlots || [])]) {
    const k = slotKey(bk.date, t);
    const cur = await s.get(k, { type: 'json' });
    if (cur?.ref === bk.ref) await s.delete(k);
  }
}
/** Fields stored on a booking from a priced quote. */
export function bookingFields(pq) {
  const main = pq.persons[0];
  return {
    itemId: main.itemId, set: main.set, addons: main.addons, addonIds: main.addonIds, price: main.price, undecided: pq.undecided || undefined,
    guests: pq.people > 1 ? pq.persons.slice(1).map(({ name, itemId, set, addons, addonIds, price, list, promoOff, undecided }) => ({ name, itemId, set, addons, addonIds, price, list, promoOff, undecided })) : undefined,
    people: pq.people, list: pq.list, promoOff: pq.promoOff, codeOff: pq.codeOff, discount: pq.discount,
    code: pq.code?.code || undefined, promo: pq.promoTitles.join(', ') || undefined, total: pq.total, mins: pq.mins,
  };
}

/** Turn the request into a list of people (1 = just the client, up to 5 for a group). */
export function readPeople(b, mainName) {
  if (Array.isArray(b.people) && b.people.length) {
    return b.people.slice(0, MAX_PEOPLE + 1).map((p, i) => ({ name: i ? p.name : mainName, item: p.item, addons: p.addons }));
  }
  return [{ name: mainName, item: b.item, addons: b.addons }];
}

