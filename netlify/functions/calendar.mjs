import { store, getSettings, sameSecret, mapUrl } from '../lib/common.mjs';

// Private calendar feed (iCalendar). Nel subscribes to /api/calendar/<token> in Google/Apple Calendar.
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function fold(line) { // RFC 5545: lines max 75 octets
  const out = []; let cur = '';
  for (const ch of line) { if (Buffer.byteLength(cur + ch) > 74) { out.push(cur); cur = ' ' + ch; } else cur += ch; }
  out.push(cur); return out.join('\r\n');
}

export default async (req, context) => {
  const s = store();
  const st = await getSettings(s);
  const token = String(context.params?.token || '').replace(/\.ics$/, '');
  if (!sameSecret(st.calToken, token)) return new Response('Not found', { status: 404 });

  const { blobs } = await s.list({ prefix: 'booking/' });
  const all = (await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' })))).filter(Boolean);
  const from = Date.now() - 60 * 864e5;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Glam By Nel//Bookings//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Glam By Nel bookings', 'X-WR-TIMEZONE:Africa/Accra', 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H'];
  for (const b of all) {
    if (!['pending', 'confirmed', 'done'].includes(b.status)) continue;
    const start = new Date(`${b.date}T${b.time}:00Z`);
    if (start.getTime() < from) continue;
    const end = new Date(start.getTime() + (b.mins || 150) * 60e3);
    const extras = b.addons?.length ? ` + ${b.addons.join(', ')}` : (b.bottom && b.set !== 'Bottom Lashes only' ? ' + Bottom lashes' : '');
    const title = `${b.status === 'pending' ? '⏳ REQUEST: ' : ''}${b.name} · ${b.undecided ? 'Undecided set' : b.set}${extras}`;
    const desc = [`Ref: ${b.ref}`, `Status: ${b.status}`, `Set: ${b.set}${extras}`, `Total: GHS ${b.total}`,
      b.phone ? `WhatsApp: https://wa.me/${b.phone}` : '', b.notes ? `Notes: ${b.notes}` : ''].filter(Boolean).join('\n');
    lines.push('BEGIN:VEVENT', `UID:${b.ref}@glambynel`, `DTSTAMP:${stamp(new Date(b.updatedAt || b.createdAt || Date.now()))}`,
      `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(desc)}`,
      `LOCATION:${esc(st.address)}`, `URL:${mapUrl(st.mapQuery)}`, `STATUS:${b.status === 'pending' ? 'TENTATIVE' : 'CONFIRMED'}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'TRIGGER:-PT1H', 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return new Response(lines.map(fold).join('\r\n') + '\r\n', {
    headers: { 'content-type': 'text/calendar; charset=utf-8', 'cache-control': 'no-store', 'content-disposition': 'inline; filename="glam-by-nel.ics"' },
  });
};
export const config = { path: '/api/calendar/:token' };
