# Her Chat

A supportive, private space to ask questions about **periods, PCOS, pregnancy**, and general sexual and reproductive health—in plain language, without feeling judged or overwhelmed. Built especially with women and people with cycles in mind.

**Her Chat** is not meant to replace your doctor or real-life care. It helps you find words for what you're feeling, understand what might be going on, and know when it's a good idea to reach out to a professional.

---

## Recent changes (after last README update)

Summary of updates made since the last README update:

### Search & navigation
- **Unified search** — One search box filters the current chat, saved chats (History), and journal entries. A “Search matches” summary shows counts for this chat, saved chats, and journal; History → Chats and Journal respect the active query. Placeholder/button text: “Search everything”.
- **About the developer** — Hamburger menu includes “About the Developer” (links to `/about#developer`). The About page has a dedicated developer section with a short bio and icon links (LinkedIn, GitHub, website, email).

### Chat & layout
- **Chat panel** — Chat area kept compact with a fixed max height (e.g. 55rem). The input/typing bar no longer grows: footer and form use `shrink-0`, and the input has a fixed height so it stays a single line.
- **Chat header status** — “Online” / “Thinking…” shown as a small pill badge with a status dot (green when Online, amber with pulse when Thinking) so it matches the header and reads clearly.
- **Vercel build** — Resolved TypeScript error in `app/api/chat/route.ts` for Gemini `generateContent` (contents typed as `Part` and cast for the SDK so the build passes).

### Dashboard
- **Visuals** — Dashboard cards restyled with gradients, icons, and shadows. New “Your cycle at a glance” card with an SVG chart: last 30 days as colored bars (by flow), symptom horizontal bars from journal tags, and a “Her Chat” footer.
- **Download chart** — “Download chart” button exports the cycle/symptom SVG as a PNG (via canvas) for users to save or share.
- **Education from dashboard** — Dashboard header has “← Back to chat” and a dedicated “Education” button that opens Education and closes the dashboard (no need to go back to chat first). Menu “Education” also closes the dashboard when opened.

### Small screens
- **Narrow layout** — On viewports &lt; 640px, placeholders shorten to “Search” or “Ask anything…”, the Search button is icon-only, and spacing is tightened so the typing bar stays usable.
- **Education** — Accessible from the dashboard via the “Education” button and from the hamburger menu; both use a shared `goToEducation()` handler that closes dashboard, history, and search and opens Education.

### Mobile scroll (Education & Dashboard)
- **Reliable scroll on mobile** — When opening **Education** or **Cycle dashboard** (from the menu or from the dashboard’s Education button), the app now:
  1. Scrolls the **page** so the chat card is in view using `window.scrollTo` (reliable on iOS/Android).
  2. Scrolls the **messages area** to the top (`listRef.scrollTop = 0`) so the Education or dashboard content is visible.
  3. Scrolls the **Education or dashboard panel** into view with `scrollIntoView({ behavior: 'auto' })` after short delays (50 ms and 300 ms) so layout has time to settle on mobile.
- **Implementation** — Shared helper `scrollChatSectionIntoView()`; refs `educationPanelRef`, `dashboardPanelRef`, and `chatSectionRef`. Scroll runs only in `useEffect` when `showEducation` or `showDashboard` becomes true (no ref-callback scroll), so opening the hamburger menu while Education or Dashboard is open does not trigger an unwanted scroll to the chatbox. All scroll behavior uses `behavior: 'auto'` for consistency on mobile.

### Multilingual chat
- **Reply in user's language** — If the user writes in a language other than English, the chatbot replies in that language (using the script or transliteration they use).
- **Language consistency** — Full conversation history is sent to the API so the model keeps the **same language** for the whole chat (e.g. no switching from Bengali to Hindi mid-conversation).
- **Spelling and transliteration** — The model is instructed to interpret the user’s intent despite typos, casual spelling, and transliteration (e.g. "cigarrete", "thikachi", "hochena").
- **In-app hint** — A hero badge and a line above the chat input say “Chat in any language—I’ll reply in yours” so users know they can type in any language.

### Doctor search
- **Any-language detection** — Doctor intent is detected from keywords in any language (e.g. “gyno”, “gynecologist”, “daktar”, “doctor”). Users can ask for doctors in Bengali, Hindi, Korean, English, etc., and the app still runs the doctor flow.
- **City from message** — If the user mentions a city (e.g. Kolkata, Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Pune, Ahmedabad), that city is used for the search even if they haven’t set a location in the menu.
- **Replies always in English** — The doctors list, “no clinics” fallback, “no location” prompt, and error message are always shown in **English** so clinic names and search tips are consistent for everyone.

### Footer & feedback
- **Footer** — Site footer (SiteShell) includes “© 2026. All rights reserved.”
- **Give feedback** — Optional “Give feedback” link in the hamburger menu; when `NEXT_PUBLIC_FEEDBACK_FORM_URL` is set (e.g. to a Google Form), it opens the form in a new tab. See “Feedback with Google Forms” below for setup.

### Other
- **Favicon** — Site favicon set to `herchatlogo.png` in `app/layout.tsx` (icon + shortcut).
- **Env & Git** — `.env.local` remains gitignored; no env keys are committed. First commit/push and Vercel deploy (e.g. push to `main`) and fixing commit author email for Vercel checks were addressed in setup.

---

## How it helps people (especially women)

- **Judgment-free questions** — Ask about periods, discharge, cramps, pregnancy, UTIs, STIs, and more in everyday language.
- **Cycle awareness** — Log period flow (light, medium, heavy, spotting), unlog when needed, and get gentle care reminders.
- **Journaling** — Body check-ins, cycle snapshots, and reflections stay on your device and help you notice patterns.
- **Finding care** — Set your location once, then ask in chat for local doctors; the app suggests nearby gynecologists and clinics with map links.
- **Education** — Bite-sized, clear info on period basics, discharge, pregnancy, UTIs, and safer sex—so you know when to see a provider.
- **Privacy-first** — No accounts, no server-side storage of your chats or logs; everything lives in your browser (local storage).

---

## Features

### Chat

- **AI-powered Q&A** — Ask anything about periods, PCOS, pregnancy, sexual health; responses are supportive and non-judgmental.
- **Multilingual** — Chat in any language; the bot replies in yours and keeps the same language for the whole conversation. Tolerates spelling and transliteration (e.g. Bengali in Latin script).
- **Image support** — Attach an image and ask the chatbot about it (e.g. for visual questions).
- **Chat history** — Save conversations as “New chat”; reopen or delete saved chats from the History panel.
- **Share chat** — Share the current conversation as text (Web Share API or copy to clipboard).
- **Search** — Search across the current chat, saved chats, and journal entries from one search bar.

### Period & journal

- **Period log** — Log today as light, medium, heavy, or spotting; unlog if needed. Logged days get a short care message.
- **Journal** — Three modes: **Body check-in**, **Cycle snapshot**, and **Reflection**. Entries are stored locally with optional auto-tags (e.g. cramps, bloating, mood).
- **Period log in History** — View all logged period days in the History → Journal tab.

### Care & location

- **Doctor search** — Ask in chat in any language (e.g. “doctors near me”, “kolkata te bhalo gyno”, “delhi me ache doctors”); the app detects doctor intent and, if you’ve set a location or mentioned a city, returns real clinic names, addresses, and “Open in Maps” links (Google Places API). All doctor-flow replies (list, search tips, no-location prompt) are in English.
- **Optional location** — Set city/country in the top menu; used for doctor suggestions and tailored education examples.
- **Education** — In-app guides on location & care, finding doctors, period basics, discharge, pregnancy, UTIs, and STIs/safer sex.

### Pages & navigation

- **About** — Why Her Chat exists, tech stack, and when data is erased. Link from the menu.
- **About the developer** — Short intro and links to LinkedIn, GitHub, website, and email.
- **Support** — Optional support via UPI (e.g. Google Pay) for users in India; QR code and “Back to Her Chat” link.
- **Give feedback** — Optional link in the menu that opens a Google Form (when `NEXT_PUBLIC_FEEDBACK_FORM_URL` is set) so users can submit feedback without a backend.

### UI/UX

- **Responsive** — Works on mobile, tablet, and desktop; horizontal scroll for journal/period buttons on small screens.
- **Soft, accessible design** — Pink–lavender–blue gradients, readable typography (Plus Jakarta Sans), and clear focus states.
- **Chat header** — “Her Chat” title with gradient dot; History, New chat, Share chat (on larger screens); status pill showing “Online” (green dot) or “Thinking…” (amber, pulsing).
- **Favicon** — Custom Her Chat bow logo as the site favicon.

---

## Tech stack

| Layer        | Technology |
|-------------|------------|
| Framework   | **Next.js 16** (App Router) |
| UI          | **React 19**, **TypeScript 5** |
| Styling     | **Tailwind CSS 4** |
| AI          | **Google Generative AI** (Gemini; e.g. `gemini-2.0-flash`) for chat and image understanding |
| Places      | **Google Places API** (and optional Maps Embed) for doctor/clinic search |
| Data        | **Browser localStorage** — no backend DB; chats, journal, period log, and location stay on the user’s device |

### How it was built

- **App Router** — `app/page.tsx` is the main client page (chat + journal + period bar + history); `app/about/page.tsx` and `app/support/page.tsx` are static/simple pages. `app/layout.tsx` sets metadata and wraps the app in `SiteShell` (conditional footer).
- **API routes** — `app/api/chat/route.ts` sends conversation (and optional image) to Gemini and returns the model reply. `app/api/doctors/route.ts` takes a location and intent, calls Google Places, and returns name, address, and Maps URL for clinics.
- **State & persistence** — React state for messages, journal, period log, history, UI toggles; `useEffect` hooks read/write to `localStorage` so data survives refresh but stays on the device.
- **Doctor flow** — If the user message looks like a doctor request and location is set, the app calls `/api/doctors` and renders structured cards with “Open in Maps”; otherwise it can prompt to set location or return a fallback message.

---

## Getting started

### Prerequisites

- Node.js (e.g. 18+)
- npm, yarn, pnpm, or bun

### Install and run

```bash
git clone https://github.com/grosssocks/herchat.git
cd herchat
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create `.env.local` in the project root (this file is gitignored; do not commit it):

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes (for chat) | Google AI Studio API key for Gemini (chat + image). |
| `GOOGLE_PLACES_API_KEY` | Yes (for doctor search) | Google Cloud API key with Places API enabled. |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | No | If set, doctor replies include an embedded map iframe. |
| `NEXT_PUBLIC_FEEDBACK_FORM_URL` | No | Full URL of your Google Form for user feedback. If set, "Give feedback" appears in the hamburger menu and opens this form in a new tab. |

Example:

```env
GEMINI_API_KEY=your_gemini_key
GOOGLE_PLACES_API_KEY=your_places_key
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=your_maps_embed_key
NEXT_PUBLIC_FEEDBACK_FORM_URL=https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform
```

### Feedback with Google Forms (optional)

To collect user feedback without a database:

1. **Create a Google Form**
   - Go to [Google Forms](https://forms.google.com) and sign in.
   - Click **Blank** (or a template).
   - Add a title, e.g. "Her Chat – Feedback".
   - Add questions, e.g.:
     - Short answer: "What did you like or find helpful?"
     - Short answer: "What could be better?"
     - (Optional) Short answer: "Email if you're okay with a follow-up" or leave anonymous.
   - Click **Send** → link icon → copy the form URL (looks like `https://docs.google.com/forms/d/e/.../viewform`).

2. **Add the URL to your app**
   - In the project root, open `.env.local`.
   - Add: `NEXT_PUBLIC_FEEDBACK_FORM_URL=https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform` (paste your copied URL).
   - Restart the dev server (`npm run dev`). For production (e.g. Vercel), add the same variable in the project settings.

3. **Use it**
   - The hamburger menu will show **Give feedback**. Clicking it opens your form in a new tab. Responses appear in Google Forms (and the linked Sheet, if you added one).

### Build for production

```bash
npm run build
npm start
```

---

## Project structure (high level)

```
herchat/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # Gemini chat + image
│   │   └── doctors/route.ts   # Google Places → clinics
│   ├── about/page.tsx         # About Her Chat + developer
│   ├── support/page.tsx       # Support / UPI
│   ├── layout.tsx             # Root layout, metadata, SiteShell
│   ├── page.tsx               # Main chat + journal + period + history
│   ├── SiteShell.tsx          # Wrapper; conditional footer
│   └── globals.css            # Tailwind + theme
├── public/                    # Favicon, images (e.g. herchatlogo.png, googlepay.png)
├── .env.local                 # Local env (do not commit)
└── package.json
```

---

## Disclaimer

Her Chat is for **general education and support only**. It does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for personal health concerns.

---

## Author

**Sujita Roy** — [LinkedIn](https://www.linkedin.com/in/sujita-roy-83b207204) · [GitHub](https://github.com/grosssocks) · [sujitaroy.com](https://sujitaroy.com)

If Her Chat has been helpful, you can [support the project](/support) (e.g. UPI for users in India).
