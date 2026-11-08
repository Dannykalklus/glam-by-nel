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
