## NLP Chatbot Website – Design (Gemini, Next.js)

### Goals

- Provide a simple marketing-style landing page that explains the NLP chatbot.
- Integrate a Gemini LLM backend to power the chatbot conversation.
- Keep the Gemini API key secure using server-side API routes and environment variables.

### Architecture

- **Framework**: Next.js App Router (existing `app` directory).
- **UI**:
  - Single main page at `/` containing:
    - Hero section (title, subtitle, CTA).
    - Feature highlights describing the chatbot.
    - Chat section pinned on the page with a conversation window and input box.
- **Chat Client**:
  - Implemented as a React client component on the main page.
  - Maintains an array of messages (`role` + `content`).
  - Sends the full conversation on each turn to the backend via `fetch` to `/api/chat`.
  - Renders styled chat bubbles for user and assistant, with auto-scrolling.

### Backend (LLM Integration)

- **API Route**: `app/api/chat/route.ts`
  - Method: `POST`.
  - Input JSON: `{ messages: { role: "user" | "model" | "system"; content: string }[] }`.
  - Validates that a non-empty user message is present.
- **LLM Provider**: Google Gemini via `@google/generative-ai`.
  - Model: `gemini-1.5-flash`.
  - API key read from `process.env.GEMINI_API_KEY`.
  - Uses non-streaming `generateContent` call for simplicity.
  - Sends a simple system-style instruction at the top of the conversation to keep the assistant friendly and concise.
- **Response**:
  - On success: returns `{ reply: string }` with the model’s text.
  - On error: logs the error on the server and returns a 500 JSON payload `{ error: "message" }`.

### Data Flow

1. User types a message and hits send.
2. Frontend pushes the user message into local state (optimistic update) and issues `POST /api/chat` with the full message history.
3. API route uses Gemini client to generate a reply.
4. Backend returns the reply text as JSON.
5. Frontend appends the assistant reply to the messages list and re-renders the chat window.

### Error Handling & UX

- Disable the send button while waiting for a response to prevent spamming.
- Show a minimal status (e.g., "Thinking…") while the request is in flight.
- If the request fails:
  - Log the error in the console for debugging.
  - Show a short inline error message in the UI instead of breaking the layout.

### Configuration

- **Environment**:
  - `.env.local` file with:
    - `GEMINI_API_KEY=YOUR_API_KEY_HERE`
  - The key is only read server-side inside `app/api/chat/route.ts`.
- **Dependencies**:
  - `@google/generative-ai` already installed and imported only on the server.

### Testing Notes

- Manual tests via the browser:
  - Page loads without errors and shows hero + chat sections.
  - Sending a message produces an assistant reply using Gemini.
  - Invalid or empty messages are rejected on the client side.
  - Temporarily removing `GEMINI_API_KEY` should yield a clear error response.

