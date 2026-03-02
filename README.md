# Her Chat

A supportive, private space to ask questions about **periods, PCOS, pregnancy**, and general sexual and reproductive health—in plain language, without feeling judged or overwhelmed. Built especially with women and people with cycles in mind.

**Her Chat** is not meant to replace your doctor or real-life care. It helps you find words for what you're feeling, understand what might be going on, and know when it's a good idea to reach out to a professional.

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
- **Image support** — Attach an image and ask the chatbot about it (e.g. for visual questions).
- **Chat history** — Save conversations as “New chat”; reopen or delete saved chats from the History panel.
- **Share chat** — Share the current conversation as text (Web Share API or copy to clipboard).
- **Search** — Search across the current chat, saved chats, and journal entries from one search bar.

### Period & journal

- **Period log** — Log today as light, medium, heavy, or spotting; unlog if needed. Logged days get a short care message.
- **Journal** — Three modes: **Body check-in**, **Cycle snapshot**, and **Reflection**. Entries are stored locally with optional auto-tags (e.g. cramps, bloating, mood).
- **Period log in History** — View all logged period days in the History → Journal tab.

### Care & location

- **Doctor search** — In chat, ask for “doctors near me” or “gynecologist near [city]”; with location set, you get real clinic names, addresses, and “Open in Maps” links (Google Places API).
- **Optional location** — Set city/country in the top menu; used for doctor suggestions and tailored education examples.
- **Education** — In-app guides on location & care, finding doctors, period basics, discharge, pregnancy, UTIs, and STIs/safer sex.

### Pages & navigation

- **About** — Why Her Chat exists, tech stack, and when data is erased. Link from the menu.
- **About the developer** — Short intro and links to LinkedIn, GitHub, website, and email.
- **Support** — Optional support via UPI (e.g. Google Pay) for users in India; QR code and “Back to Her Chat” link.

### UI/UX

- **Responsive** — Works on mobile, tablet, and desktop; horizontal scroll for journal/period buttons on small screens.
- **Soft, accessible design** — Pink–lavender–blue gradients, readable typography (Plus Jakarta Sans), and clear focus states.
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

Example:

```env
GEMINI_API_KEY=your_gemini_key
GOOGLE_PLACES_API_KEY=your_places_key
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=your_maps_embed_key
```

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
