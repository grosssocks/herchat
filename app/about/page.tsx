import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-6 py-12 text-[#2d2430] bg-gradient-to-br from-[#fdf2f8] via-[#f5f3ff] to-[#eff6ff]">
      <div className="mb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-[#e9e0f0] bg-white px-4 py-2 text-[0.8rem] font-medium text-[#5c4d5a] shadow-sm hover:bg-[#f5f3ff] hover:text-[#6d28d9] hover:border-[#c4b5fd]/60"
        >
          ← Back to Her Chat
        </Link>
      </div>
      <h1 className="text-[1.6rem] font-semibold">
        About <span className="bg-gradient-to-r from-[#ec4899] via-[#a78bfa] to-[#3b82f6] bg-clip-text text-transparent">Her Chat</span>
      </h1>
      <p className="text-[0.95rem] text-[#5c4d5a]">
        Her Chat is a small passion project by Sujita Roy, created to make it easier to ask
        questions about periods, PCOS, pregnancy, and general sexual and reproductive health in
        plain language—without feeling judged or overwhelmed.
      </p>
      <p className="text-[0.95rem] text-[#5c4d5a]">
        It&apos;s not meant to replace your doctor or real-life care, but to help you find words
        for what you&apos;re feeling, understand what might be going on, and know when it&apos;s a
        good idea to reach out to a professional.
      </p>
      <section className="mt-2 rounded-2xl border border-[#e9e0f0] bg-white px-4 py-3">
        <h2 className="text-[0.95rem] font-semibold text-[#4b3b5a]">Tech stack</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.9rem] text-[#7a6d7a]">
          <li>Next.js 16 (App Router) with React</li>
          <li>TypeScript for safer, typed components</li>
          <li>Tailwind&nbsp;CSS 4 for the soft, pastel UI</li>
          <li>Local storage in your browser for chat history, period logs, and journal entries</li>
        </ul>
      </section>
      <section
        id="developer"
        className="mt-2 rounded-2xl border border-[#e9e0f0] bg-white px-4 py-3"
      >
        <h2 className="text-[0.95rem] font-semibold text-[#4b3b5a]">
          About the developer
        </h2>
        <p className="mt-1 text-[0.9rem] text-[#7a6d7a]">
          Hi, I&apos;m Sujita Roy — a developer who cares a lot about making tech feel softer,
          kinder, and more approachable, especially around topics that can feel awkward or
          overwhelming. Her Chat started as a small side project to combine my love for frontend
          design, AI, and women&apos;s health education into one gentle space.
        </p>
        <p className="mt-1 text-[0.9rem] text-[#7a6d7a]">
          I&apos;m always learning and improving this project in my spare time, so if something
          feels confusing, clunky, or you&apos;d love to see a new feature, your feedback genuinely
          helps me grow as a developer.
        </p>
        <div className="mt-3">
          <p className="mb-2 font-medium text-[#4b3b5a] text-[0.9rem]">Find me online</p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://www.linkedin.com/in/sujita-roy-83b207204"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e9e0f0] bg-[#f8f4f8] text-[#0a66c2] transition hover:bg-[#eef5fc] hover:border-[#0a66c2]/30"
              aria-label="LinkedIn"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://github.com/grosssocks"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e9e0f0] bg-[#f8f4f8] text-[#24292f] transition hover:bg-[#f3f4f6] hover:border-[#d0d7de]"
              aria-label="GitHub"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href="https://sujitaroy.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e9e0f0] bg-[#f8f4f8] text-[#5c4d5a] transition hover:bg-[#f5f3ff] hover:border-[#a78bfa]/40 hover:text-[#6d28d9]"
              aria-label="Personal website"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2c2.5 2.7 4 6.2 4 10s-1.5 7.3-4 10" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2c-2.5 2.7-4 6.2-4 10s1.5 7.3 4 10" />
              </svg>
            </a>
            <a
              href="mailto:sujitaworks@gmail.com"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e9e0f0] bg-[#f8f4f8] text-[#5c4d5a] transition hover:bg-[#fdf2f8] hover:border-[#f9a8d4]/50 hover:text-[#be185d]"
              aria-label="Email"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          </div>
        </div>
      </section>
      <p className="mt-2 text-[0.8rem] text-[#9a8d98]">
        Your chats and logs stay on your device in your browser&apos;s local storage—there&apos;s no
        separate account or database for your personal data. This data will disappear if you clear
        your browser data for this site, use a private/incognito window and close it, or switch to a
        different browser or device.
      </p>
    </main>
  );
}

