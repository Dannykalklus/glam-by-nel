import {
  store, json, isAdmin, getSettings, openSlots, slotKey, isDate, isTime, clean, normalizePhone, newRef, newToken,
  getMenu, sanitizeMenu, quote, TAGS, GUIDE_KEYS, DEFAULT_SETTINGS, DEFAULT_MENU,
} from '../lib/common.mjs';
import { randomBytes } from 'node:crypto';

const ACTIVE = ['pending', 'confirmed'];

async function allBookings(s) {
  const { blobs } = await s.list({ prefix: 'booking/' });
  const items = await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' })));
  return items.filter(Boolean).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

async function releaseSlot(s, bk) {
  const k = slotKey(bk.date, bk.time);
  const cur = await s.get(k, { type: 'json' });
  if (cur?.ref === bk.ref) await s.delete(k);
}

async function lockSlot(s, ref, date, time) {
  const k = slotKey(date, time);
  const r = await s.setJSON(k, { ref }, { onlyIfNew: true });
  if (r.modified) return true;
  const cur = await s.get(k, { type: 'json' });
  return cur?.ref === ref;
}

export default async (req) => {
  if (!isAdmin(req)) return json({ ok: false, error: process.env.ADMIN_PASSWORD ? 'Wrong password' : 'ADMIN_PASSWORD is not set in Netlify' }, 401);
  const s = store();

  if (req.method === 'GET') {
    const [bookings, availability, settings, looks, guide, open, menu] = await Promise.all([
      allBookings(s), s.get('availability', { type: 'json' }), getSettings(s),
      s.get('looks', { type: 'json' }), s.get('guide', { type: 'json' }), openSlots(s), getMenu(s),
    ]);
    if (!settings.calToken) { // create the private calendar link on first use
      settings.calToken = newToken();
      await s.setJSON('settings', settings);
    }
    return json({ ok: true, bookings, availability: availability || {}, settings, looks: looks || [], guide: guide || {}, open, menu });
  }

  let b;
  try { b = await req.json(); } catch { return json({ ok: false, error: 'Bad request' }, 400); }

  switch (b.action) {
    case 'login': return json({ ok: true });

    case 'setAvailability': {
      const out = {};
      for (const [d, ts] of Object.entries(b.availability || {})) {
        if (!isDate(d) || !Array.isArray(ts)) continue;
        const times = [...new Set(ts.filter(isTime))].sort();
        if (times.length) out[d] = times;
      }
      await s.setJSON('availability', out);
      return json({ ok: true, availability: out });
    }

    case 'setSettings': {
      const cur = await getSettings(s);
      const n = b.settings || {};
      const next = {
        slots: Array.isArray(n.slots) ? [...new Set(n.slots.filter(isTime))].sort() : cur.slots,
        leadHours: Number.isFinite(+n.leadHours) ? Math.max(0, Math.min(72, +n.leadHours)) : cur.leadHours,
        address: n.address != null ? clean(n.address, 200) : cur.address,
        mapQuery: n.mapQuery != null ? clean(n.mapQuery, 200) || cur.mapQuery : cur.mapQuery,
        banner: n.banner ? { on: !!n.banner.on, text: clean(n.banner.text, 160) } : cur.banner,
        calToken: n.newCalToken ? newToken() : cur.calToken,
        templates: { ...cur.templates },
      };
      for (const k of Object.keys(DEFAULT_SETTINGS.templates)) if (typeof n.templates?.[k] === 'string') next.templates[k] = n.templates[k].slice(0, 2000);
      await s.setJSON('settings', next);
      return json({ ok: true, settings: next });
    }

    case 'status': {
      const bk = await s.get(`booking/${b.ref}`, { type: 'json' });
      if (!bk) return json({ ok: false, error: 'Booking not found' }, 404);
      const st = b.status;
      if (!['pending', 'confirmed', 'declined', 'cancelled', 'done', 'noshow'].includes(st)) return json({ ok: false, error: 'Bad status' }, 400);
      if (ACTIVE.includes(st) && !ACTIVE.includes(bk.status)) {
        if (!(await lockSlot(s, bk.ref, bk.date, bk.time))) return json({ ok: false, error: 'That slot is now held by another booking. Reschedule instead.' }, 409);
      }
      if (['declined', 'cancelled'].includes(st)) await releaseSlot(s, bk);
      bk.status = st; bk.updatedAt = new Date().toISOString();
      await s.setJSON(`booking/${bk.ref}`, bk);
      return json({ ok: true, booking: bk });
    }

    case 'reschedule': {
      const bk = await s.get(`booking/${b.ref}`, { type: 'json' });
      if (!bk) return json({ ok: false, error: 'Booking not found' }, 404);
      if (!isDate(b.date) || !isTime(b.time)) return json({ ok: false, error: 'Pick a date and time' }, 400);
      if (!(await lockSlot(s, bk.ref, b.date, b.time))) return json({ ok: false, error: 'That slot is already booked' }, 409);
      await releaseSlot(s, bk);
      Object.assign(bk, { date: b.date, time: b.time, updatedAt: new Date().toISOString() });
      if (!ACTIVE.includes(bk.status)) bk.status = 'confirmed';
      await s.setJSON(`booking/${bk.ref}`, bk);
      return json({ ok: true, booking: bk });
    }

    case 'manual': {
      const m = b.booking || {};
      if (!clean(m.name)) return json({ ok: false, error: 'Name is required' }, 400);
      if (!isDate(m.date) || !isTime(m.time)) return json({ ok: false, error: 'Pick a date and time' }, 400);
      const q = quote(await getMenu(s), clean(m.item, 80), Array.isArray(m.addons) ? m.addons.map(String) : [], { allowInactive: true });
      if (!q) return json({ ok: false, error: 'Choose a set' }, 400);
      const ref = newRef();
      if (!(await lockSlot(s, ref, m.date, m.time))) return json({ ok: false, error: 'That slot is already booked' }, 409);
      const bk = {
        ref, name: clean(m.name, 80), phone: normalizePhone(m.phone) || '', ...q,
        date: m.date, time: m.time, notes: clean(m.notes, 600), status: 'confirmed', source: 'manual', createdAt: new Date().toISOString(),
      };
      await s.setJSON(`booking/${ref}`, bk);
      return json({ ok: true, booking: bk });
    }

    case 'edit': { // change client details, set, add-ons or price on an existing booking
      const bk = await s.get(`booking/${b.ref}`, { type: 'json' });
      if (!bk) return json({ ok: false, error: 'Booking not found' }, 404);
      const e = b.changes || {};
      if (e.name != null) bk.name = clean(e.name, 80) || bk.name;
      if (e.phone != null) bk.phone = normalizePhone(e.phone) || '';
      if (e.notes != null) bk.notes = clean(e.notes, 600);
      if (e.item) {
        const q = quote(await getMenu(s), clean(e.item, 80), Array.isArray(e.addons) ? e.addons.map(String) : [], { allowInactive: true });
        if (!q) return json({ ok: false, error: 'Choose a set' }, 400);
        delete bk.undecided; delete bk.bottom; Object.assign(bk, q);
      }
      if (e.total != null && e.total !== '') bk.total = Math.max(0, Math.min(100000, Math.round(+e.total || 0)));
      bk.updatedAt = new Date().toISOString();
      await s.setJSON(`booking/${bk.ref}`, bk);
      return json({ ok: true, booking: bk });
    }

    case 'setMenu': {
      const menu = b.reset ? DEFAULT_MENU : sanitizeMenu(b.menu);
      if (!menu.categories.length) return json({ ok: false, error: 'Keep at least one category' }, 400);
      await s.setJSON('menu', menu);
      return json({ ok: true, menu });
    }

    case 'delete': {
      const bk = await s.get(`booking/${b.ref}`, { type: 'json' });
      if (bk) { await releaseSlot(s, bk); await s.delete(`booking/${b.ref}`); }
      return json({ ok: true });
    }

    case 'uploadLook': {
      const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(b.dataUrl || '');
      if (!m) return json({ ok: false, error: 'Unsupported image' }, 400);
      const buf = Buffer.from(m[2], 'base64');
      if (buf.length > 4.5e6) return json({ ok: false, error: 'Image too large' }, 413);
      const id = Date.now().toString(36) + randomBytes(3).toString('hex');
      const tag = TAGS.includes(b.tag) ? b.tag : 'other';
      await s.set(`look/${id}`, buf, { metadata: { type: m[1] } });
      const looks = (await s.get('looks', { type: 'json' })) || [];
      looks.unshift({ id, tag, caption: clean(b.caption, 60), w: +b.w || 0, h: +b.h || 0, ts: Date.now() });
      await s.setJSON('looks', looks);
      return json({ ok: true, looks });
    }

    case 'updateLook': {
      const looks = (await s.get('looks', { type: 'json' })) || [];
      const l = looks.find((x) => x.id === b.id);
      if (!l) return json({ ok: false, error: 'Not found' }, 404);
      if (TAGS.includes(b.tag)) l.tag = b.tag;
      if (typeof b.caption === 'string') l.caption = clean(b.caption, 60);
      if (typeof b.move === 'number') {
        const i = looks.indexOf(l), j = Math.max(0, Math.min(looks.length - 1, i + b.move));
        looks.splice(i, 1); looks.splice(j, 0, l);
      }
      await s.setJSON('looks', looks);
      return json({ ok: true, looks });
    }

    case 'deleteLook': {
      const looks = ((await s.get('looks', { type: 'json' })) || []).filter((x) => x.id !== b.id);
      await s.setJSON('looks', looks);
      await s.delete(`look/${b.id}`);
      const guide = (await s.get('guide', { type: 'json' })) || {};
      for (const k of Object.keys(guide)) if (guide[k] === b.id) delete guide[k];
      await s.setJSON('guide', guide);
      return json({ ok: true, looks, guide });
    }

    case 'setGuide': {
      const guide = (await s.get('guide', { type: 'json' })) || {};
      if (!GUIDE_KEYS.includes(b.key)) return json({ ok: false, error: 'Bad guide type' }, 400);
      if (b.id) guide[b.key] = b.id; else delete guide[b.key];
      await s.setJSON('guide', guide);
      return json({ ok: true, guide });
    }
  }
  return json({ ok: false, error: 'Unknown action' }, 400);
};
export const config = { path: '/api/admin' };
