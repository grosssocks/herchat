export default function SupportPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12 text-center text-[#2d2430]">
      <h1 className="text-[1.5rem] font-semibold mb-2">Support Sujita</h1>
      <p className="text-[0.9rem] text-[#7a6d7a] mb-2">
        If Her Chat has been helpful for you and you&apos;d like to support my work, you can scan this
        UPI code using Google Pay or any UPI app.
      </p>
      <p className="text-[0.8rem] text-[#9a8d98] mb-4">
        This UPI option is for supporters in India only.
      </p>
      <div className="rounded-2xl border border-[#f4cfe0] bg-white/90 p-3 shadow-[0_4px_18px_rgba(244,114,182,0.15)]">
        <a href="/googlepay.png" download className="block">
          <img
            src="/googlepay.png"
            alt="Support via UPI – Google Pay QR (click to download)"
            className="h-40 w-auto rounded-xl"
          />
        </a>
      </div>
      <p className="mt-3 text-[0.8rem] text-[#9a8d98]">
        Thank you for even thinking about supporting me—it really means a lot.
      </p>
      <div className="mt-4 flex gap-3">
        <a
          href="/googlepay.png"
          download
          className="rounded-2xl bg-gradient-to-r from-[#f9a8d4] to-[#f5d0fe] px-4 py-2 text-[0.8rem] font-medium text-[#4b2245] shadow-[0_4px_14px_rgba(244,114,182,0.25)] hover:opacity-90"
        >
          Download QR
        </a>
        <a
          href="/"
          className="rounded-2xl border border-[#e9e0f0] bg-white/90 px-4 py-2 text-[0.8rem] font-medium text-[#5c4d5a] hover:bg-[#f5f3ff]"
        >
          Back to Her Chat
        </a>
      </div>
    </main>
  );
}

