// Shared helpers for Glam By Nel functions
import { getStore } from '@netlify/blobs';
import { createHash, timingSafeEqual, randomBytes } from 'node:crypto';

export const MENU = {
  'Volume Wispy Set': 330, 'Hybrid Wispy Set': 215, 'Mini Hybrid Wispy': 195, 'Classic Wispy': 180,
  'Volume Cat Eye Set': 300, 'Hybrid Cat Eye Set': 210, 'Mini Hybrid Cat Eye Set': 190, 'Classic Cat Eye Set': 175,
  'Normal Volume Set': 280, 'Normal Hybrid Set': 200, 'Normal Mini Hybrid Set': 180, 'Normal Classic Lash': 160,
  'Bottom Lashes only': 0,
};
export const BOTTOM_PRICE = 70;
export const TAGS = ['wispy', 'cateye', 'classic', 'hybrid', 'volume', 'other'];
export const GUIDE_KEYS = ['classic', 'hybrid', 'volume', 'wispy', 'cateye'];

export const DEFAULT_SETTINGS = {
  slots: ['08:00', '11:00', '14:00', '17:00'],
  leadHours: 2,
  address: 'Capitol Hill, Lord of Peace – Sowutuom, Accra',
  mapQuery: '5.6425759,-0.2904883', // Lord Of Peace School, Sowutuom
  templates: {
    confirm: "Hi {name}! 💕 Your appointment with Glam By Nel is CONFIRMED.\n\n💎 {set}\n📅 {date}\n⏰ {time}\n💰 {total}\n🔖 Ref: {ref}\n\n📍 {address}\nMap: {map}\n\nPlease come with clean, makeup-free lashes. See you soon! ✨",
    decline: "Hi {name}, thank you for choosing Glam By Nel 💕 Unfortunately {date} at {time} is no longer available. Here are my next open slots:\n{openings}\n\nReply with the one that suits you and I'll lock it in for you. ✨",
    reminder: "Hi {name}! ✨ Just a reminder of your Glam By Nel appointment tomorrow, {date} at {time} ({set}).\n\n📍 {address}\nMap: {map}\n\nPlease come with clean, makeup-free lashes. See you soon! 💕",
    reschedule: "Hi {name}! 💕 Your Glam By Nel appointment has been moved to {date} at {time} ({set}). Ref: {ref}. See you then! ✨",
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

export function normalizePhone(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10 && d.startsWith('0')) d = '233' + d.slice(1); // Ghana local format
  if (d.length === 9) d = '233' + d;
  return d.length >= 10 && d.length <= 15 ? d : null;
}

export function newRef() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = randomBytes(5);
  return 'GN-' + [...b].map((x) => a[x % a.length]).join('');
}

export async function getSettings(s = store()) {
  const v = await s.get('settings', { type: 'json' });
  return { ...DEFAULT_SETTINGS, ...(v || {}), templates: { ...DEFAULT_SETTINGS.templates, ...(v?.templates || {}) } };
}

export async function takenSlots(s = store()) {
  const { blobs } = await s.list({ prefix: 'slot/' });
  return new Set(blobs.map((b) => b.key));
}

/** Open slots from today onward, minus taken ones and slots inside the lead time. */
export async function openSlots(s = store()) {
  const [avail, taken, settings] = await Promise.all([s.get('availability', { type: 'json' }), takenSlots(s), getSettings(s)]);
  const out = {};
  const today = todayAccra();
  const cutoff = Date.now() + (settings.leadHours || 0) * 3600e3;
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
