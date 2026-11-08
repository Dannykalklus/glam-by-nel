# Glam By Nel: website and booking system

- **Website:** `index.html` (the public site at `/`)
- **Nel's dashboard:** `admin.html` (opens at `/admin`)
- **Booking backend:** `netlify/functions/` (Netlify Functions, with data stored in Netlify Blobs)

No database or paid service is needed. Everything runs on Netlify's free plan.

---

## 1. Publish on Netlify (about 10 minutes)

> Netlify's **drag-and-drop upload does NOT run the booking backend.** Deploy from GitHub as below, or use the Netlify CLI.

1. Create a free GitHub account, make a **new repository** (e.g. `glam-by-nel`), and upload every file and folder in this project to it. You can use the "uploading an existing file" link on GitHub and drag the folder contents in.
2. Go to **app.netlify.com**, then **Add new site → Import an existing project → GitHub**, and pick the repository.
3. Leave the build settings as they are (`netlify.toml` already sets them) and click **Deploy**.
4. **Set the dashboard password:** go to **Site configuration → Environment variables → Add a variable**:
   - Key: `ADMIN_PASSWORD`
   - Value: a strong password only Nel knows

   Then **Deploys → Trigger deploy → Deploy site** so the password takes effect.
5. **Email alerts for new bookings (recommended):**
   - Go to **Forms** and click **Enable form detection**, then redeploy.
   - Go to **Site configuration → Notifications → Form submission notifications → Add notification → Email notification**, choose the `booking` form, and enter Nel's email.
6. **Custom domain (optional):** go to **Domain management → Add a domain**, e.g. `glambynel.com`.

**CLI alternative:** run `npm install`, then `npx netlify-cli deploy --prod` from this folder.

---

## 2. How bookings work

1. **Nel opens dates and times** in `/admin → Availability`, either by tapping a day and its times, or with **Quick fill** to open several weeks at once.
2. **The client books on the website.** She picks a set, sees **only open slots**, and sends her request. That slot is **held immediately**, so nobody else can take it. She gets a reference (e.g. `GN-7K3QX`) and a button to send the request to Nel on WhatsApp.
3. **Nel gets notified** by email (if set up in step 5), by the client's WhatsApp message, and by the red badge in the dashboard.
4. **Nel confirms** in `/admin → Bookings`:
   - **✓ Confirm** opens WhatsApp to the client with the confirmation message already written (date, time, set, price, address, map link). She checks it and taps send.
   - **Decline** frees the slot and opens WhatsApp with a polite message that lists her next open slots.
   - **Reschedule** moves the booking and messages the client the new time.
   - **Reminder** sends the "see you tomorrow" message.
   - **+ Add booking** is for clients who booked by DM or phone call, so the slot is blocked on the website too.
5. **Edit the messages** any time in `/admin → Settings → WhatsApp message templates`.

> WhatsApp messages open ready to send, and Nel taps **Send**. Sending fully automatically would require the paid WhatsApp Business API.

**Tip for Nel:** open `yoursite.com/admin` on her phone, then use **Add to Home Screen** so it works like an app.

---

## 3. Photos from Instagram

Instagram doesn't let other websites pull photos directly, so photos are added in one of two ways:

- **Easiest (no code):** in `/admin → Looks`, tap **Add photos**, choose the lash type, and upload. Photos are resized automatically and appear in the gallery right away.
  - Under **Lash guide photos**, choose which photo shows the finished look for Classic, Hybrid, Volume, Wispy and Cat Eye.
- **Bundled with the site:** put files in `images/looks/` (and list them in `CONFIG.looks` near the top of the script in `index.html`), or in `images/guide/` named `classic.jpg`, `hybrid.jpg`, `volume.jpg`, `wispy.jpg`, `cateye.jpg`.

Photos uploaded in the dashboard take priority over the bundled ones.

---

## 4. Map and location

The map and the **Get directions** and **Open in Waze** buttons point to the exact pin from Nel's Google Maps link (Lord Of Peace School, Sowutuom: `5.6425759, -0.2904883`).

**For an exact pin:**

1. In Google Maps, press and hold on the studio and copy the numbers (e.g. `5.6239, -0.2789`).
2. Paste them into `/admin → Settings → Map pin`.

The website map, directions buttons and confirmation messages all update.

---

## 5. Editing site details

The block at the top of the main script in `index.html` holds the WhatsApp number, the Instagram link, the address and the bundled photos:

```js
const CONFIG = { whatsapp: '233593761476', instagram: 'https://www.instagram.com/nels_glam/', ... }
```

Prices and sets are edited in the dashboard (**Menu** tab). The lists in `index.html` and `netlify/lib/common.mjs` are only the starting defaults.

---

## 6. Newer dashboard features

- **Menu tab:** change prices, rename or reorder sets, hide a set ("Show on website"), add new categories (Nails, Lash Class, Infills…) and add-ons. Save, and the website updates instantly.
- **"Not sure yet" bookings:** clients can book without choosing a set. Those bookings show **Needs help choosing**; tap **Help choose** to message them, then **Edit** to set the final set and price.
- **Edit booking:** change the client's name or number, the set, add-ons, price (discounts or extras) and notes.
- **Export:** download all bookings as a CSV spreadsheet (opens in Excel or Google Sheets).
- **Earned this month:** the total of bookings marked *Completed* this month.
- **Website announcement:** a banner at the top of the site (Settings → Website announcement).
- **Calendar sync:** Settings → *Sync bookings to your phone calendar*. Subscribe once in Google Calendar or on iPhone, and bookings appear automatically with a 1-hour reminder. Keep the link private; "New private link" stops the old one working.

The site also has a branded share preview (`og-image.jpg`) for WhatsApp and Instagram links, and phones get a lighter version without 3D for speed.
