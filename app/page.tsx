"use client";

import { useEffect, useRef, useState } from "react";

type Place = { name: string; address: string; mapsUrl: string };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
  mapQuery?: string;
  places?: Place[];
  placesLocation?: string;
};

type SavedChat = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
};

type JournalEntryType = "checkin" | "snapshot" | "reflection";

type JournalMood = "okay" | "exhausted" | "anxious" | "mixed" | "unknown";

type JournalEntry = {
  id: string;
  type: JournalEntryType;
  text: string;
  createdAt: string;
  tags: string[];
  mood: JournalMood;
};

type PeriodFlow = "light" | "medium" | "heavy" | "spotting";

type PeriodEntry = {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  flow: PeriodFlow;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [chatHistory, setChatHistory] = useState<SavedChat[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalMode, setJournalMode] = useState<JournalEntryType | null>(null);
  const [historyView, setHistoryView] = useState<"chats" | "journal">("chats");
  const [periodEntries, setPeriodEntries] = useState<PeriodEntry[]>([]);
  const [userLocation, setUserLocation] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const firstMatchRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);

  const inputPrompts = [
    "Ask about periods, PCOS, pregnancy…",
    "Ask about discharge, cramps, or mood swings…",
    "Ask about trying to get pregnant…",
    "Ask about pain, bleeding, or symptoms…",
  ];
  const inputPromptsShort = "Ask anything…";
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);

  useEffect(() => {
    const check = () => setIsNarrowScreen(typeof window !== "undefined" && window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);
  const hasPeriodToday = periodEntries.some((p) => p.date === todayIso);

  const query = searchQuery.trim().toLowerCase();
  const filteredMessages =
    query === ""
      ? messages
      : messages.filter((m) => {
          if (m.content === "(image attached)") return false;
          return m.content.toLowerCase().includes(query);
        });

  const historyMatches =
    query === ""
      ? []
      : chatHistory.filter((chat) => {
          const titleMatch = chat.title.toLowerCase().includes(query);
          const messageMatch = chat.messages.some(
            (m) =>
              m.content &&
              m.content !== "(image attached)" &&
              m.content.toLowerCase().includes(query),
          );
          return titleMatch || messageMatch;
        });

  const journalMatches =
    query === ""
      ? []
      : journalEntries.filter((entry) => entry.text.toLowerCase().includes(query));

  const visibleHistoryChats = showSearch && query ? historyMatches : chatHistory;
  const visibleJournalEntries = showSearch && query ? journalMatches : journalEntries;

  const sortedPeriodEntries = [...periodEntries].sort((a, b) => b.date.localeCompare(a.date));
  const symptomCounts = journalEntries.reduce<Record<string, number>>((acc, entry) => {
    for (const tag of entry.tags) {
      acc[tag] = (acc[tag] ?? 0) + 1;
    }
    return acc;
  }, {});
  const topSymptoms = Object.entries(symptomCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const last30Days = (() => {
    const out: { date: string; flow?: PeriodFlow }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      const entry = periodEntries.find((p) => p.date === date);
      out.push({ date, flow: entry?.flow });
    }
    return out;
  })();
  const periodFlowColors: Record<PeriodFlow, string> = {
    heavy: "#be123c",
    medium: "#e11d48",
    light: "#fda4af",
    spotting: "#a78bfa",
  };

  // Load and persist current chat messages in localStorage so they survive refresh
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("her-chat-messages");
      if (raw) {
        const parsed = JSON.parse(raw) as Message[];
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("her-chat-messages", JSON.stringify(messages));
    } catch {
      // ignore write errors
    }
  }, [messages]);

  useEffect(() => {
    if (!query || filteredMessages.length === 0) return;
    const id = requestAnimationFrame(() => {
      firstMatchRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(id);
  }, [query, filteredMessages.length]);

  // Gently rotate example prompts in the input placeholder when not searching
  useEffect(() => {
    if (showSearch) return;
    if (inputPrompts.length <= 1) return;
    const id = window.setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % inputPrompts.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [showSearch]);

  function highlightMatch(text: string, search: string, isUser: boolean) {
    if (!search || !text) return text;
    const parts = text.split(new RegExp(`(${escapeRegExp(search)})`, "gi"));
    const markClass = isUser
      ? "rounded bg-white/40 font-medium"
      : "rounded bg-amber-200/80 font-medium text-[#2d2430]";
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} className={markClass}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  function renderMessageContent(text: string, search: string, isUser: boolean) {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const segments: any[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const pushHighlighted = (chunk: string) => {
      if (!chunk) return;
      if (search) {
        const highlighted = highlightMatch(chunk, search, isUser);
        if (Array.isArray(highlighted)) {
          segments.push(...highlighted);
        } else {
          segments.push(highlighted);
        }
      } else {
        segments.push(chunk);
      }
    };

    while ((match = urlRegex.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      pushHighlighted(before);
      const url = match[0];
      segments.push(
        <a
          key={`url-${segments.length}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className={
            isUser
              ? "underline decoration-white/70 underline-offset-2"
              : "underline decoration-[#a855f7] decoration-1 underline-offset-2"
          }
        >
          {url}
        </a>,
      );
      lastIndex = match.index + url.length;
    }

    const after = text.slice(lastIndex);
    pushHighlighted(after);

    return segments;
  }

  function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /** Parse old/saved doctor-list content so we can show cards even when message has no `places`. */
  function parseDoctorListFromContent(content: string): { places: Place[]; location: string } | null {
    if (!content || !content.includes("I can't personally vouch") || !content.includes("Open in Maps:")) {
      return null;
    }
    const locationMatch = content.match(/around\s+([^.]+?)\s+you can check out/);
    const location = locationMatch ? locationMatch[1].trim() : "";
    const parts = content.split(/\n\s*•\s+/);
    if (parts.length < 2) return null;
    const places: Place[] = [];
    for (let i = 1; i < parts.length; i++) {
      const block = parts[i];
      const mapsMatch = block.match(/\n\s*Open in Maps:\s*(\S+)/);
      if (!mapsMatch) continue;
      const mapsUrl = mapsMatch[1].trim();
      const firstLine = block.split("\n")[0].trim();
      if (!firstLine || firstLine.startsWith("Always double-check")) break;
      const dashIdx = firstLine.indexOf(" — ");
      const name = dashIdx >= 0 ? firstLine.slice(0, dashIdx).trim() : firstLine;
      const address = dashIdx >= 0 ? firstLine.slice(dashIdx + 3).trim() : "";
      if (name) places.push({ name, address, mapsUrl });
    }
    return places.length > 0 ? { places, location } : null;
  }

  function analyzeJournalText(text: string): { tags: string[]; mood: JournalMood } {
    const lower = text.toLowerCase();
    const tags: string[] = [];

    if (/(cramp|cramps|crampy)/.test(lower)) tags.push("cramps");
    if (/(bloat|bloated)/.test(lower)) tags.push("bloating");
    if (/(tired|exhausted|drained|worn out|dead)/.test(lower)) tags.push("low-energy");
    if (/(anxious|anxiety|worried|scared|nervous)/.test(lower)) tags.push("anxious");
    if (/(sad|down|low mood)/.test(lower)) tags.push("low-mood");
    if (/(fine|okay|ok|good|chill|alright)/.test(lower)) tags.push("mostly-okay");
    if (/(spotting|heavy bleed|light bleed|bleeding)/.test(lower)) tags.push("bleeding");

    let mood: JournalMood = "unknown";
    if (/(tired|exhausted|drained|worn out|dead)/.test(lower)) {
      mood = "exhausted";
    } else if (/(anxious|anxiety|worried|scared|nervous)/.test(lower)) {
      mood = "anxious";
    } else if (/(fine|okay|ok|good|chill|alright)/.test(lower)) {
      mood = "okay";
    } else if (tags.length > 1) {
      mood = "mixed";
    }

    return { tags, mood };
  }

  function addJournalEntry(type: JournalEntryType, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const { tags, mood } = analyzeJournalText(trimmed);
    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      type,
      text: trimmed,
      createdAt: new Date().toISOString(),
      tags,
      mood,
    };
    setJournalEntries((prev) => [entry, ...prev]);
  }

  function logPeriodToday(defaultFlow: PeriodFlow = "medium") {
    const date = todayIso;
    setPeriodEntries((prev) => {
      const existingIndex = prev.findIndex((p) => p.date === date);
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], flow: defaultFlow };
        return copy;
      }
      return [
        {
          id: crypto.randomUUID(),
          date,
          flow: defaultFlow,
        },
        ...prev,
      ];
    });

    const now = new Date();
    const displayDate = now.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const displayTime = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

    let careLine: string;
    if (defaultFlow === "light" || defaultFlow === "spotting") {
      careLine =
        "Light days and spotting still count — gentle movement, hydration, and breathable underwear can help you feel more comfortable.";
    } else if (defaultFlow === "medium") {
      careLine =
        "A medium-flow day is a good time to listen to your energy: mix rest with light movement, keep up with water, and change products regularly so you stay comfy.";
    } else {
      careLine =
        "On heavy-flow days, it’s extra important to rest where you can, stay well hydrated, change products frequently, and watch for clots, dizziness, or soaking through products very quickly — those are signs to check in with a doctor.";
    }

    const noteMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        `Got it — I've logged ${displayDate} at ${displayTime} as a ${defaultFlow} flow period day for you.\n\n` +
        `${careLine} If pain, bleeding, or symptoms ever feel different from your normal, it's a good idea to check in with a doctor.`,
    };
    setMessages((prev) => [...prev, noteMessage]);
  }

  function unlogPeriodToday() {
    const date = todayIso;
    if (!periodEntries.some((p) => p.date === date)) return;
    setPeriodEntries((prev) => prev.filter((p) => p.date !== date));

    const noteMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "No problem, I’ve cleared today as a logged period day.",
    };
    setMessages((prev) => [...prev, noteMessage]);
  }

  function handleNewChat() {
    if (messages.length > 0) {
      const titleBase =
        messages.find((m) => m.role === "user")?.content ||
        messages[0]?.content ||
        "New chat";
      const title =
        titleBase.length > 40 ? `${titleBase.slice(0, 37)}…` : titleBase;

      const newEntry: SavedChat = {
        id: crypto.randomUUID(),
        title,
        messages,
        createdAt: new Date().toISOString(),
      };
      setChatHistory((prev) => [newEntry, ...prev]);
    }

    setMessages([]);
    setInput("");
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setSearchQuery("");
    setShowSearch(false);
    setShowHistory(false);
    setShowEducation(false);
    setJournalMode(null);
  }

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Load and persist chat history in localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("her-chat-history");
      if (raw) {
        const parsed = JSON.parse(raw) as SavedChat[];
        if (Array.isArray(parsed)) {
          setChatHistory(parsed);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("her-chat-history", JSON.stringify(chatHistory));
    } catch {
      // ignore write errors
    }
  }, [chatHistory]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("her-chat-journal");
      if (raw) {
        const parsed = JSON.parse(raw) as JournalEntry[];
        if (Array.isArray(parsed)) {
          setJournalEntries(parsed);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("her-chat-journal", JSON.stringify(journalEntries));
    } catch {
      // ignore write errors
    }
  }, [journalEntries]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("her-chat-periods");
      if (raw) {
        const parsed = JSON.parse(raw) as PeriodEntry[];
        if (Array.isArray(parsed)) {
          setPeriodEntries(parsed);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("her-chat-periods", JSON.stringify(periodEntries));
    } catch {
      // ignore write errors
    }
  }, [periodEntries]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("her-chat-location");
      if (raw) {
        setUserLocation(raw);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const trimmed = userLocation.trim();
      if (trimmed) {
        window.localStorage.setItem("her-chat-location", trimmed);
      } else {
        window.localStorage.removeItem("her-chat-location");
      }
    } catch {
      // ignore
    }
  }, [userLocation]);

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  function downloadChart() {
    const wrapper = chartRef.current;
    const svg = wrapper?.querySelector("svg");
    if (!svg || typeof document === "undefined") return;
    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    const w = 600;
    const h = 320;
    svgClone.setAttribute("width", String(w));
    svgClone.setAttribute("height", String(h));
    const svgString = new XMLSerializer().serializeToString(svgClone);
    const dataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#fdf2f8";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "her-chat-cycle-chart.png";
      a.click();
    };
    img.onerror = () => {};
    img.src = dataUrl;
  }

  function handleDeleteChat(id: string) {
    setChatHistory((prev) => prev.filter((chat) => chat.id !== id));
  }

  async function handleShareChat() {
    if (messages.length === 0) return;

    const plainMessages = messages
      .filter((m) => m.content && m.content !== "(image attached)")
      .map((m) => `${m.role === "user" ? "You" : "Her Chat"}: ${m.content}`)
      .join("\n\n");

    const now = new Date();
    const displayDate = now.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const displayTime = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

    const header = "Conversation from Her Chat 💗";
    const subheader = `Shared on ${displayDate} at ${displayTime}`;
    const divider = "────────────────────────";
    const body = `${header}\n${subheader}\n${divider}\n\n${plainMessages}`;

    try {
      if (typeof navigator !== "undefined") {
        const nav = navigator as any;
        if (nav.share) {
          await nav.share({
            title: "Her Chat",
            text: body,
          });
          return;
        }
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(body);
          window.alert("Chat copied to your clipboard. You can paste it into any app.");
          return;
        }
      }
    } catch {
      // ignore share errors
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if ((!trimmed && !imageFile) || isLoading) return;

    const lower = trimmed.toLowerCase();

    // Handle request for local doctors list without calling the LLM.
    if (
      !imageFile &&
      (lower.includes("local doctor") ||
        lower.includes("doctors list") ||
        lower.includes("doctors near") ||
        lower.includes("list of doctors") ||
        lower.includes("find me a doctor") ||
        lower.includes("doctor near me"))
    ) {
      const loc = userLocation.trim();
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };

      if (!loc) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I’d love to help you find someone nearby. Tap the menu button (three lines) at the very top, open Education, and add your city + country under “Location & care options”. Once that’s saved, ask me again for local doctors and I’ll suggest search phrases tailored to your area.",
        };
        setMessages((prev) => [...prev, userMessage, assistantMessage]);
        setInput("");
        clearImage();
        setError(null);
        setIsLoading(false);
        return;
      }

      // We have a location — call the doctors API to get real places.
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      clearImage();
      setError(null);
      setIsLoading(true);

      try {
        const res = await fetch("/api/doctors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location: loc, intent: "gyn" }),
        });

        if (!res.ok) {
          throw new Error("Couldn't reach the places service.");
        }

        const data = (await res.json()) as {
          places?: { name: string; address: string; mapsUrl: string }[];
          error?: string;
        };

        const places = data.places ?? [];

        let reply: string;
        const mapQuery = `gynecologist in ${loc}`;
        if (places.length === 0) {
          const mapsUrl = `https://www.google.com/maps/search/gynecologist+${encodeURIComponent(
            loc,
          )}`;
          reply =
            `I couldn't pull up specific clinics right now, but you can still search near you. For ${loc}, try:\n\n` +
            `• "gynecologist near ${loc}" or "OB-GYN clinic ${loc}"\n` +
            `• "sexual health clinic ${loc}"\n` +
            `• "urgent care ${loc}" if something feels urgent\n\n` +
            `Open in Maps: ${mapsUrl}\n\n` +
            `Always double-check reviews and your insurance/coverage before you book.`;
        } else {
          const lines = places.slice(0, 3).map((p) => {
            const addr = p.address ? ` — ${p.address}` : "";
            return `• ${p.name}${addr}\n  Open in Maps: ${p.mapsUrl}`;
          });

          reply =
            `I can't personally vouch for anyone, but here are some options around ${loc} you can check out:\n\n` +
            lines.join("\n") +
            `\n\nAlways double-check reviews, opening hours, and your insurance/coverage before you book.`;
        }

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
          mapQuery,
          ...(places.length > 0 && { places: places.slice(0, 3), placesLocation: loc }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error(err);
        const mapsUrl = `https://www.google.com/maps/search/gynecologist+${encodeURIComponent(
          loc,
        )}`;
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            `I ran into an issue pulling clinics, but you can still search nearby. Try these searches for ${loc}:\n\n` +
            `• "gynecologist near ${loc}" or "OB-GYN clinic ${loc}"\n` +
            `• "sexual health clinic ${loc}"\n` +
            `• "urgent care ${loc}" if something feels urgent\n\n` +
            `Open in Maps: ${mapsUrl}`,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setError(
          err instanceof Error
            ? err.message
            : "Trouble reaching the places service. Try again in a bit.",
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Handle simple local questions about today's period log without calling the LLM.
    if (
      !imageFile &&
      (lower.includes("which period did i log") ||
        lower.includes("what period did i log") ||
        lower.includes("what flow did i log") ||
        lower.includes("what period did i log today") ||
        lower.includes("which flow did i log"))
    ) {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };

      const todayEntry = periodEntries.find((p) => p.date === todayIso);
      let reply: string;
      if (todayEntry) {
        reply = `Right now I’ve got today logged as a ${todayEntry.flow} flow period day.`;
      } else if (periodEntries.length > 0) {
        const last = periodEntries[0];
        reply = `I haven’t logged today yet, but the last period day I noted was ${new Date(
          last.date,
        ).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })} as a ${last.flow} flow day.`;
      } else {
        reply =
          "I haven’t logged any period days here yet. You can tap one of the period buttons above to add today.";
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput("");
      clearImage();
      setError(null);
      setIsLoading(false);
      return;
    }

    const currentImageFile = imageFile;
    const currentImagePreview = imagePreview;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed || "(image attached)",
      imagePreview: currentImagePreview ?? undefined,
    };

    const historyForApi = [
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        content: m.content === "(image attached)" ? "What do you see in this image?" : m.content,
      })),
      { role: "user", content: trimmed || "What do you see in this image?" },
    ];

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    clearImage();
    setIsLoading(true);
    setError(null);

    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;
    if (currentImageFile) {
      imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) ?? "");
        reader.onerror = reject;
        reader.readAsDataURL(currentImageFile);
      });
      imageMimeType = currentImageFile.type || "image/jpeg";
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi,
          ...(imageBase64 && { imageBase64, imageMimeType }),
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || "Something went wrong.");
      }

      const data = (await res.json()) as { reply: string };
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (journalMode && trimmed) {
        addJournalEntry(journalMode, trimmed);
        setJournalMode(null);
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reach the chatbot. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f4f8] text-[#2d2430]">
      {/* Soft gradient orbs in the background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-1/4 h-80 w-80 rounded-full bg-[#fce7ef]/70 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-[#ede9fe]/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[32rem] -translate-x-1/2 rounded-full bg-[#fdf2f8]/50 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl items-center justify-end px-6 pt-6 lg:pt-8">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[#e9e0f0] bg-white text-[#5c4d5a] shadow-sm hover:bg-[#f5f3ff] hover:text-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-[#c4b5fd]/40"
            aria-label="Open menu"
            aria-expanded={showMenu}
          >
            <span className="space-y-1.5">
              <span className="block h-0.5 w-4 rounded-full bg-current" />
              <span className="block h-0.5 w-4 rounded-full bg-current" />
              <span className="block h-0.5 w-4 rounded-full bg-current" />
            </span>
          </button>
          {showMenu && (
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-[#e9e0f0] bg-white/95 py-1 text-left text-[0.8rem] text-[#4b3b5a] shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
              <div className="border-b border-[#f3e7f5] px-3 pb-2 pt-2">
                <p className="text-[0.75rem] font-semibold text-[#4b3b5a]">
                  About Her Chat
                </p>
                <p className="mt-0.5 text-[0.72rem] text-[#7a6d7a]">
                  A gentle space to ask about periods, PCOS, pregnancy, and more.
                  Tap below to read why it was built and how it works.
                </p>
                <a
                  href="/about"
                  className="mt-1 inline-flex text-[0.72rem] font-medium text-[#be185d] underline decoration-[#f9a8d4]/80 underline-offset-2 hover:text-[#9d174d]"
                  onClick={() => setShowMenu(false)}
                >
                  Learn more
                </a>
                <a
                  href="/about#developer"
                  className="mt-1 block text-[0.72rem] font-medium text-[#7a6d7a] underline decoration-[#e9d5ff]/80 underline-offset-2 hover:text-[#6d28d9]"
                  onClick={() => setShowMenu(false)}
                >
                  About the developer
                </a>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowDashboard(true);
                  setShowEducation(false);
                  setShowHistory(false);
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-[#f5f3ff]"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#e0e7ff] text-[0.7rem]">
                  📊
                </span>
                <span>Cycle dashboard</span>
              </button>
              <div className="border-b border-[#f3e7f5] px-3 pb-2 pt-2">
                <p className="text-[0.72rem] font-medium text-[#7a6d7a]">
                  Location (optional)
                </p>
                <input
                  type="text"
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  placeholder="e.g. Mumbai, India"
                  className="mt-1 w-full rounded-xl border border-[#e9e0f0] bg-white px-2.5 py-1.5 text-[0.75rem] text-[#2d2430] outline-none placeholder:text-[#9a8d98] focus:border-[#a78bfa] focus:ring-1 focus:ring-[#c4b5fd]/40"
                />
                {userLocation.trim() && (
                  <button
                    type="button"
                    onClick={() => setUserLocation("")}
                    className="mt-1 text-[0.7rem] text-[#9a8d98] hover:text-[#7a6d7a]"
                  >
                    Clear location
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowEducation(true);
                  setShowHistory(false);
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-[#f5f3ff]"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#f9a8d4]/30 text-[0.7rem]">
                  📚
                </span>
                <span>Education</span>
              </button>
              <a
                href="/support"
                className="flex w-full items-center gap-2 px-3 py-2 text-[#7a6d7a] hover:bg-[#f5f3ff]"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#fee2e2] text-[0.65rem]">
                  ❤
                </span>
                <span>Support this project</span>
              </a>
            </div>
          )}
        </div>
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-14 px-6 pb-16 pt-6 lg:flex-row lg:items-stretch lg:gap-20 lg:pb-20 lg:pt-10">
        <section className="flex flex-1 flex-col justify-center gap-7">
          <span className="inline-flex w-fit items-center text-[var(--text-small)] font-medium leading-[var(--text-small--line)] text-[#3d2c3a]">
            <span className="relative inline-flex items-center gap-2 rounded-full border border-pink-200/80 bg-[linear-gradient(to_right,#fce7f3_0%,#fce7f3_50%,#ede9fe_50%,#ede9fe_100%)] px-5 py-2 shadow-[0_4px_14px_rgba(249,168,212,0.3)]">
              <span
                className="pointer-events-none absolute inset-[1px] rounded-full bg-[linear-gradient(to_right,#fdf2f8_0%,#fdf2f8_50%,#f5f3ff_50%,#f5f3ff_100%)] opacity-95"
                aria-hidden="true"
              />
              <span className="relative text-base" aria-hidden>🌸</span>
              <span className="relative bg-gradient-to-r from-[#ec4899] via-[#a78bfa] to-[#3b82f6] bg-clip-text text-[0.8rem] font-medium tracking-[0.12em] uppercase text-transparent">
                Her Chat
              </span>
            </span>
          </span>
          <h1 className="text-balance font-semibold text-[#2d2430] text-[clamp(2rem,5vw,3.5rem)] tracking-[var(--text-display--tracking)] leading-[var(--text-display--line)]">
            A supportive space for{" "}
            <span className="bg-gradient-to-r from-[#db2777] via-[#c084fc] to-[#3b82f6] bg-clip-text text-transparent">
              periods, PCOS, pregnancy & more
            </span>
          </h1>
          <p className="max-w-lg text-balance text-[#5c4d5a] text-[var(--text-body-lg)] leading-[var(--text-body-lg--line)] break-words">
            Ask questions in plain language. Private, judgment-free, and here to help—not replace—your doctor.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-br from-[#fdf2f8] to-[#fce7f3]/80 p-4 shadow-[0_4px_16px_rgba(249,168,212,0.15)] backdrop-blur-sm ring-1 ring-pink-200/60 break-words">
              <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-lg shadow-sm" aria-hidden>🌸</span>
              <p className="font-semibold text-[#2d2430] text-[var(--text-small)] leading-[var(--text-small--line)]">
                Periods & cycles
              </p>
              <p className="mt-1.5 text-[#7a6d7a] text-[var(--text-caption)] leading-[var(--text-caption--line)]">
                Track, understand, and get support.
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe]/80 p-4 shadow-[0_4px_16px_rgba(196,181,253,0.18)] backdrop-blur-sm ring-1 ring-violet-200/60 break-words">
              <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-lg shadow-sm" aria-hidden>💜</span>
              <p className="font-semibold text-[#2d2430] text-[var(--text-small)] leading-[var(--text-small--line)]">
                PCOS & pregnancy
              </p>
              <p className="mt-1.5 text-[#7a6d7a] text-[var(--text-caption)] leading-[var(--text-caption--line)]">
                Info and reassurance when you need it.
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-[#fce7f3] to-[#fbcfe8]/80 p-4 shadow-[0_4px_16px_rgba(244,114,182,0.12)] backdrop-blur-sm ring-1 ring-pink-200/50 break-words">
              <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-lg shadow-sm" aria-hidden>💕</span>
              <p className="font-semibold text-[#2d2430] text-[var(--text-small)] leading-[var(--text-small--line)]">
                Private & safe
              </p>
              <p className="mt-1.5 text-[#7a6d7a] text-[var(--text-caption)] leading-[var(--text-caption--line)]">
                Your chats stay between you and the bot.
              </p>
            </div>
          </div>
          <p className="text-[0.75rem] text-[#7a6d7a] leading-snug">
            Not medical advice. Always see a healthcare provider for diagnosis and treatment.
          </p>
        </section>

        <section className="flex flex-1 flex-col min-h-0 max-h-[55rem]">
          <div className="flex min-h-[28rem] max-h-[55rem] flex-1 flex-col overflow-hidden rounded-3xl bg-white/95 shadow-[0_8px_40px_rgba(249,168,212,0.12),0_0_0_1px_rgba(244,114,182,0.08)] backdrop-blur-md">
            {hasPeriodToday && (
              <div className="flex items-center gap-2 px-5 pt-3">
                <img
                  src="/menstrual-pad.png"
                  alt="Menstrual pad icon indicating a logged period day"
                  className="h-7 w-auto drop-shadow-sm"
                />
                <span className="text-[0.7rem] font-medium text-rose-500">
                  Period day logged
                </span>
              </div>
            )}
            <header className="flex items-center justify-between border-b border-pink-100/80 px-5 py-3.5 bg-gradient-to-r from-[#fdf2f8] via-[#faf5ff] to-[#eff6ff]">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-br from-[#ec4899] via-[#a78bfa] to-[#3b82f6] shadow-[0_0_0_2px_rgba(255,255,255,0.9)]" />
                <p className="font-medium text-[var(--text-small)] leading-[var(--text-small--line)] bg-gradient-to-r from-[#db2777] via-[#a78bfa] to-[#3b82f6] bg-clip-text text-transparent">
                  Her Chat
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEducation(false);
                    setShowHistory((prev) => !prev);
                  }}
                  className="hidden rounded-2xl border border-[#e9e0f0] bg-white px-3 py-1.5 text-[var(--text-caption)] text-[#5c4d5a] shadow-sm hover:bg-[#f5f3ff] hover:text-[#6d28d9] sm:inline-flex"
                >
                  {showHistory ? "Close history" : "History"}
                </button>
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="hidden rounded-2xl border border-[#e9e0f0] bg-white px-3 py-1.5 text-[var(--text-caption)] text-[#5c4d5a] shadow-sm hover:bg-[#f5f3ff] hover:text-[#6d28d9] sm:inline-flex"
                >
                  ✨ New chat
                </button>
                <button
                  type="button"
                  onClick={handleShareChat}
                  className="hidden rounded-2xl border border-[#e9e0f0] bg-white px-3 py-1.5 text-[var(--text-caption)] text-[#5c4d5a] shadow-sm hover:bg-[#f5f3ff] hover:text-[#6d28d9] sm:inline-flex"
                >
                  Share chat
                </button>
                <span className="text-[#7a6d7a] text-[var(--text-caption)] leading-[var(--text-caption--line)]">
                  {isLoading ? "Thinking…" : "Online"}
                </span>
              </div>
            </header>

            <div className="flex items-center gap-2 border-b border-pink-100/80 bg-gradient-to-r from-[#fdf2f8]/60 to-[#faf5ff]/60 px-5 py-2 text-[var(--text-caption)] text-[#7a6d7a]">
              <span className="hidden shrink-0 text-[0.7rem] text-[#9a8d98] sm:inline">
                Journal:
              </span>
              <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setJournalMode("checkin");
                    setShowHistory(false);
                    setShowEducation(false);
                    setShowDashboard(false);
                    setShowSearch(false);
                    setSearchQuery("");
                    const prompt: Message = {
                      id: crypto.randomUUID(),
                      role: "assistant",
                      content: "Body check-in: how’s your body feeling today? Anything cycle-related on your mind?",
                    };
                    setMessages((prev) => [...prev, prompt]);
                  }}
                  className="shrink-0 rounded-2xl border border-[#e9e0f0] bg-white px-3 py-1 text-[0.7rem] hover:bg-[#f5f3ff] hover:text-[#6d28d9]"
                >
                  Body check-in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJournalMode("snapshot");
                    setShowHistory(false);
                    setShowEducation(false);
                    setShowDashboard(false);
                    setShowSearch(false);
                    setSearchQuery("");
                    const prompt: Message = {
                      id: crypto.randomUUID(),
                      role: "assistant",
                      content: "Cycle snapshot: if this phase had a caption, what would it be?",
                    };
                    setMessages((prev) => [...prev, prompt]);
                  }}
                  className="shrink-0 rounded-2xl border border-[#e9e0f0] bg-white px-3 py-1 text-[0.7rem] hover:bg-[#f5f3ff] hover:text-[#6d28d9]"
                >
                  Cycle snapshot
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJournalMode("reflection");
                    setShowHistory(false);
                    setShowEducation(false);
                    setShowDashboard(false);
                    setShowSearch(false);
                    setSearchQuery("");
                    const prompt: Message = {
                      id: crypto.randomUUID(),
                      role: "assistant",
                      content: "Reflection: what’s one thing your body handled better than you expected this month?",
                    };
                    setMessages((prev) => [...prev, prompt]);
                  }}
                  className="shrink-0 rounded-2xl border border-[#e9e0f0] bg-white px-3 py-1 text-[0.7rem] hover:bg-[#f5f3ff] hover:text-[#6d28d9]"
                >
                  Reflect
                </button>
                <span className="hidden shrink-0 text-[#d4d4d8] sm:inline">|</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="hidden text-[0.7rem] text-[#9a8d98] sm:inline">
                    Period today:
                  </span>
                  {(["light", "medium", "heavy", "spotting"] as const).map((flow) => (
                    <button
                      key={flow}
                      type="button"
                      onClick={() => {
                        setShowHistory(false);
                        setShowEducation(false);
                        setShowDashboard(false);
                        setShowSearch(false);
                        setSearchQuery("");
                        logPeriodToday(flow);
                      }}
                      className="shrink-0 rounded-2xl border border-rose-200 bg-rose-50/80 px-2.5 py-1 text-[0.7rem] capitalize text-rose-500 hover:bg-rose-100 hover:border-rose-300"
                    >
                      {flow}
                    </button>
                  ))}
                  {hasPeriodToday && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowHistory(false);
                        setShowEducation(false);
                        setShowDashboard(false);
                        setShowSearch(false);
                        setSearchQuery("");
                        unlogPeriodToday();
                      }}
                      className="ml-1 shrink-0 rounded-2xl border border-violet-200/80 bg-white/90 px-2.5 py-1 text-[0.7rem] text-violet-700 hover:bg-violet-50 hover:border-violet-300"
                    >
                      Unlog today
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div
              ref={listRef}
              className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
            >
              {showSearch && query && !showEducation && !showHistory && !showDashboard && (
                <div className="space-y-2 rounded-2xl border border-[#efe8f2] bg-white/80 px-3 py-2 text-[0.8rem] text-[#5c4d5a]">
                  <p className="text-[0.75rem] font-medium text-[#4b3b5a]">
                    Search matches
                  </p>
                  <div className="space-y-1 text-[0.75rem] text-[#7a6d7a]">
                    <p>
                      In this chat:{" "}
                      <span className="font-medium text-[#4b3b5a]">
                        {filteredMessages.length}
                      </span>{" "}
                      message{filteredMessages.length === 1 ? "" : "s"}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!historyMatches.length) return;
                        setShowHistory(true);
                        setHistoryView("chats");
                      }}
                      className="block w-full text-left text-[#7a6d7a] hover:text-[#6d28d9]"
                    >
                      In saved chats:{" "}
                      <span className="font-medium text-[#4b3b5a]">
                        {historyMatches.length}
                      </span>{" "}
                      match{historyMatches.length === 1 ? "" : "es"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!journalMatches.length) return;
                        setShowHistory(true);
                        setHistoryView("journal");
                      }}
                      className="block w-full text-left text-[#7a6d7a] hover:text-[#6d28d9]"
                    >
                      In journal:{" "}
                      <span className="font-medium text-[#4b3b5a]">
                        {journalMatches.length}
                      </span>{" "}
                      {journalMatches.length === 1 ? "entry" : "entries"}
                    </button>
                  </div>
                </div>
              )}

              {showDashboard ? (
                <div className="space-y-4 text-[var(--text-small)] text-[#2d2430]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#fce7f3] to-[#f5d0fe] text-lg shadow-[0_2px_8px_rgba(249,168,212,0.25)]">
                        📊
                      </span>
                      <h2 className="text-[1rem] font-semibold bg-gradient-to-r from-[#be185d] to-[#7c3aed] bg-clip-text text-transparent">
                        Cycle dashboard
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDashboard(false)}
                      className="shrink-0 rounded-xl border border-[#e9e0f0] bg-white/90 px-3 py-2 text-[0.75rem] font-medium text-[#5c4d5a] shadow-sm hover:bg-[#f5f3ff] hover:border-[#c4b5fd]/50 hover:text-[#6d28d9] transition"
                    >
                      ← Back to chat
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="overflow-hidden rounded-2xl border border-pink-200/60 bg-gradient-to-br from-[#fdf2f8] via-white to-[#fce7f3]/50 px-4 py-4 shadow-[0_4px_20px_rgba(249,168,212,0.12)] ring-1 ring-pink-100/50">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100/80 text-sm">🌸</span>
                        <h3 className="text-[0.9rem] font-semibold text-[#831843]">
                          Period overview
                        </h3>
                      </div>
                      {sortedPeriodEntries.length === 0 ? (
                        <p className="text-[0.8rem] text-[#9a8d98] leading-snug">
                          You haven&apos;t logged any period days here yet. Use the period buttons above to add today.
                        </p>
                      ) : (
                        <>
                          <p className="mb-3 text-[0.8rem] text-[#7a6d7a]">
                            You&apos;ve logged{" "}
                            <span className="font-bold text-rose-600">
                              {sortedPeriodEntries.length}
                            </span>{" "}
                            period day{sortedPeriodEntries.length === 1 ? "" : "s"}.
                          </p>
                          <ul className="space-y-2">
                            {sortedPeriodEntries.slice(0, 6).map((p) => (
                              <li
                                key={p.id}
                                className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 shadow-[0_1px_6px_rgba(244,114,182,0.1)] border border-pink-100/60"
                              >
                                <span className="text-[0.8rem] font-medium text-[#4b3b5a]">
                                  {new Date(p.date).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <span className="rounded-full bg-gradient-to-r from-rose-100 to-pink-100 px-2.5 py-0.5 text-[0.75rem] font-medium capitalize text-rose-600 ring-1 ring-rose-200/50">
                                  {p.flow}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-[#f5f3ff] via-white to-[#ede9fe]/50 px-4 py-4 shadow-[0_4px_20px_rgba(196,181,253,0.12)] ring-1 ring-violet-100/50">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100/80 text-sm">💜</span>
                        <h3 className="text-[0.9rem] font-semibold text-[#5b21b6]">
                          Symptom patterns
                        </h3>
                      </div>
                      {topSymptoms.length === 0 ? (
                        <p className="text-[0.8rem] text-[#9a8d98] leading-snug">
                          Once you start using the journal, I&apos;ll highlight patterns like cramps, bloating, or mood changes here.
                        </p>
                      ) : (
                        <>
                          <p className="mb-3 text-[0.8rem] text-[#7a6d7a]">
                            From your journal entries:
                          </p>
                          <ul className="space-y-2">
                            {topSymptoms.map(([tag, count]) => (
                              <li
                                key={tag}
                                className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 shadow-[0_1px_6px_rgba(139,92,246,0.08)] border border-violet-100/60"
                              >
                                <span className="text-[0.8rem] font-medium capitalize text-[#4b3b5a]">
                                  {tag.replace(/-/g, " ")}
                                </span>
                                <span className="rounded-full bg-violet-100/80 px-2.5 py-0.5 text-[0.75rem] font-semibold text-violet-700">
                                  {count}×
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>

                  <div
                    ref={chartRef}
                    className="overflow-hidden rounded-2xl border border-pink-200/60 bg-gradient-to-br from-[#fdf2f8] via-white to-[#f5f3ff] px-4 py-4 shadow-[0_4px_20px_rgba(249,168,212,0.1)] ring-1 ring-pink-100/50"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100/80 text-sm">📈</span>
                        <h3 className="text-[0.9rem] font-semibold text-[#831843]">
                          Your cycle at a glance
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={downloadChart}
                        className="shrink-0 rounded-xl border border-[#e9e0f0] bg-white px-3 py-2 text-[0.75rem] font-medium text-[#5c4d5a] shadow-sm hover:bg-[#f5f3ff] hover:border-[#c4b5fd]/50 hover:text-[#6d28d9] transition"
                      >
                        Download chart
                      </button>
                    </div>
                    <div className="min-h-[200px] w-full">
                      <svg
                        viewBox="0 0 600 320"
                        className="h-auto w-full max-w-full"
                        aria-label="Cycle and symptom chart"
                      >
                        <rect width="600" height="320" fill="#fdf2f8" />
                        <text x="300" y="22" textAnchor="middle" fill="#831843" fontSize="14" fontWeight="600" fontFamily="system-ui, sans-serif">
                          Period days (last 30 days)
                        </text>
                        {last30Days.map((day, i) => {
                          const x = 20 + (i / 29) * 560;
                          const hasFlow = day.flow != null;
                          const fill = hasFlow ? periodFlowColors[day.flow!] : "#e9e0f0";
                          return (
                            <g key={day.date}>
                              <rect
                                x={x}
                                y={36}
                                width={14}
                                height={24}
                                rx={3}
                                fill={fill}
                                stroke={hasFlow ? "#be185d40" : "#d4d4d8"}
                                strokeWidth="0.5"
                              />
                            </g>
                          );
                        })}
                        <text x="20" y="88" fill="#5b21b6" fontSize="12" fontWeight="600" fontFamily="system-ui, sans-serif">
                          Symptoms
                        </text>
                        {topSymptoms.length > 0 ? (
                          topSymptoms.map(([tag, count], i) => {
                            const y = 100 + i * 28;
                            const maxCount = Math.max(...topSymptoms.map(([, c]) => c), 1);
                            const barW = (count / maxCount) * 200;
                            return (
                              <g key={tag}>
                                <text x="20" y={y + 10} fill="#4b3b5a" fontSize="11" fontFamily="system-ui, sans-serif">
                                  {tag.replace(/-/g, " ")}
                                </text>
                                <rect x="120" y={y - 8} width={barW} height={14} rx={4} fill="#a78bfa" fillOpacity="0.8" />
                                <text x={128 + barW} y={y + 10} fill="#5c4d5a" fontSize="10" fontFamily="system-ui, sans-serif">
                                  {count}×
                                </text>
                              </g>
                            );
                          })
                        ) : (
                          <text x="20" y="115" fill="#9a8d98" fontSize="11" fontFamily="system-ui, sans-serif">
                            No journal tags yet
                          </text>
                        )}
                        <text x="20" y="300" fill="#9a8d98" fontSize="9" fontFamily="system-ui, sans-serif">
                          Her Chat · For personal reference only
                        </text>
                      </svg>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-[#fffbeb]/80 via-white to-[#fef3c7]/40 px-4 py-3 shadow-[0_2px_12px_rgba(245,158,11,0.06)]">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-base" aria-hidden>💡</span>
                      <div>
                        <h3 className="text-[0.85rem] font-semibold text-[#92400e]">
                          How to use this
                        </h3>
                        <p className="mt-1 text-[0.8rem] text-[#78716c] leading-snug">
                          This dashboard helps you notice patterns over time—not to label anything as “good” or “bad”. If you see changes that worry you, that&apos;s a good time to bring these notes to a provider.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : showEducation ? (
                <div className="space-y-3 text-[var(--text-small)] text-[#2d2430]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[0.95rem] font-semibold text-[#4b3b5a]">
                      Education
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowEducation(false)}
                      className="rounded-full border border-[#e9e0f0] bg-white px-3 py-1 text-[0.75rem] text-[#7a6d7a] hover:bg-[#f5f3ff]"
                    >
                      Back to chat
                    </button>
                  </div>

                  <div className="rounded-2xl border border-[#e9e0f0] bg-white px-4 py-3">
                    <h3 className="text-[0.9rem] font-semibold text-[#4b3b5a]">
                      Location & care options
                    </h3>
                    {userLocation.trim() ? (
                      <>
                        <p className="mt-1 text-[#7a6d7a]">
                          I&apos;ll use your saved city + country to tailor some of the examples and
                          doctor‑search phrases.
                        </p>
                        <p className="mt-2 text-[0.75rem] text-[#9a8d98]">
                          Current saved location:{" "}
                          <span className="font-medium text-[#4b3b5a]">
                            {userLocation.trim()}
                          </span>
                          . You can update it anytime from the top menu.
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-[#7a6d7a]">
                        I don&apos;t see your exact location yet. If you share your city + country from
                        the top menu, I can tailor some of the examples and doctor‑search phrases.
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#e9e0f0] bg-white px-4 py-3">
                    <h3 className="text-[0.9rem] font-semibold text-[#4b3b5a]">
                      Finding local doctors
                    </h3>
                    <p className="mt-1 text-[#7a6d7a]">
                      When something feels off, having a trusted clinic to call makes a huge difference.
                      You can ask me right in the chat box to help you search—just say something like
                      “find me a gynecologist near me” or “doctor near&nbsp;{userLocation.trim() || "my city"}”.
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-[#7a6d7a] text-[0.8rem]">
                      <li>
                        {!userLocation.trim()
                          ? "“gynecologist near me” or “OB‑GYN clinic”"
                          : `“gynecologist near ${userLocation.trim()}” or “OB‑GYN clinic ${userLocation.trim()}”`}
                      </li>
                      <li>
                        {!userLocation.trim()
                          ? "“sexual health clinic near me”"
                          : `“sexual health clinic ${userLocation.trim()}”`}
                      </li>
                      <li>
                        {!userLocation.trim()
                          ? "“urgent care near me” (for things that feel more urgent)"
                          : `“urgent care ${userLocation.trim()}” (for things that feel more urgent)`}
                      </li>
                    </ul>
                    <p className="mt-1 text-[0.75rem] text-[#9a8d98]">
                      Always double‑check reviews, opening hours, and whether they match your insurance/coverage
                      before booking.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#e9e0f0] bg-white px-4 py-3">
                    <h3 className="text-[0.9rem] font-semibold text-[#4b3b5a]">
                      Period basics
                    </h3>
                    <p className="mt-1 text-[#7a6d7a]">
                      Your cycle isn&apos;t just your period—it&apos;s a whole pattern. Bleeding
                      that comes roughly every 21–35 days, lasts 3–7 days, and is heavy at the
                      start then eases off is often normal. If it&apos;s suddenly way heavier,
                      lasts more than a week, or you&apos;re soaking through pads/cups every hour,
                      that&apos;s one of those times to chat with a provider.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#e9e0f0] bg-white px-4 py-3">
                    <h3 className="text-[0.9rem] font-semibold text-[#4b3b5a]">
                      Vaginal discharge
                    </h3>
                    <p className="mt-1 text-[#7a6d7a]">
                      Discharge is your vagina&apos;s way of cleaning itself. Clear or white, not
                      super smelly, and that changes through your cycle (more stretchy/slippy
                      around ovulation, drier after) is usually normal. Things to flag: strong
                      or fishy smell, green/grey color, cottage-cheese clumps, or itching/burning.
                      Those can mean an infection and are worth getting checked.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#e9e0f0] bg-white px-4 py-3">
                    <h3 className="text-[0.9rem] font-semibold text-[#4b3b5a]">
                      Trying for pregnancy
                    </h3>
                    <p className="mt-1 text-[#7a6d7a]">
                      Most couples don&apos;t get pregnant instantly. Focusing on the few days
                      before and during ovulation (when discharge is clear and stretchy like egg
                      white) matters way more than “every single day”. Taking a prenatal with
                      folic acid, not smoking, and keeping alcohol lower while you&apos;re trying
                      are simple starting points.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#e9e0f0] bg-white px-4 py-3">
                    <h3 className="text-[0.9rem] font-semibold text-[#4b3b5a]">
                      UTIs & bladder health
                    </h3>
                    <p className="mt-1 text-[#7a6d7a]">
                      UTIs often feel like burning when you pee, needing to pee all the time,
                      and lower tummy discomfort. Things that can help lower risk: staying
                      hydrated, not holding your pee for ages, peeing after sex, wiping
                      front-to-back, and avoiding super harsh soaps on your vulva. If you ever
                      see blood in your pee, have fever, or pain in your back/sides, that&apos;s a
                      “call a doctor soon” situation.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#e9e0f0] bg-white px-4 py-3">
                    <h3 className="text-[0.9rem] font-semibold text-[#4b3b5a]">
                      STIs/STDs & safer sex
                    </h3>
                    <p className="mt-1 text-[#7a6d7a]">
                      Many STIs have zero symptoms at first, which is why regular testing is
                      such a big deal if you&apos;re sexually active with new or multiple partners.
                      Using condoms or other barrier methods every time, getting vaccinated
                      where possible (like HPV), and testing before/after new partners are
                      simple, non-judgy ways to protect yourself. If something suddenly feels
                      off—sores, burning, weird discharge—don&apos;t wait it out, get it checked.
                    </p>
                  </div>

                  <p className="text-[0.7rem] text-[#9a8d98]">
                    This space is for general education only and doesn&apos;t replace a real-life
                    healthcare provider. If something feels off in your body, trust that and get
                    it looked at.
                  </p>
                </div>
              ) : showHistory ? (
                <div className="space-y-3">
                  <div className="flex gap-2 text-[var(--text-caption)]">
                    <button
                      type="button"
                      onClick={() => setHistoryView("chats")}
                      className={`rounded-full px-3 py-1 ${
                        historyView === "chats"
                          ? "bg-[#f5f3ff] text-[#4b3b5a]"
                          : "bg-white text-[#7a6d7a] border border-[#e9e0f0]"
                      }`}
                    >
                      Chats
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryView("journal")}
                      className={`rounded-full px-3 py-1 ${
                        historyView === "journal"
                          ? "bg-[#f5f3ff] text-[#4b3b5a]"
                          : "bg-white text-[#7a6d7a] border border-[#e9e0f0]"
                      }`}
                    >
                      Journal
                    </button>
                  </div>

                  {historyView === "chats" && (
                    <div className="space-y-2">
                      {visibleHistoryChats.length === 0 ? (
                        <p className="text-center text-[var(--text-small)] text-[#7a6d7a]">
                          {showSearch && query
                            ? `No saved chats match "${searchQuery.trim()}".`
                            : "No previous chats yet. Start a conversation, then tap + New chat to save it here."}
                        </p>
                      ) : (
                        visibleHistoryChats.map((chat) => (
                          <div
                            key={chat.id}
                            className="flex w-full items-start justify-between rounded-2xl border border-[#e9e0f0] bg-white px-3 py-2 text-left hover:border-[#c4b5fd] hover:bg-[#f5f3ff]"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setMessages(chat.messages);
                                setShowHistory(false);
                                setShowSearch(false);
                                setSearchQuery("");
                              }}
                              className="flex-1 text-left"
                            >
                              <p className="text-[var(--text-small)] text-[#2d2430]">
                                {chat.title}
                              </p>
                              <p className="mt-0.5 text-[var(--text-caption)] text-[#9a8d98]">
                                {new Date(chat.createdAt).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              <span className="mt-0.5 block text-[var(--text-caption)] text-[#9a8d98]">
                                {chat.messages.length} msg
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat.id);
                              }}
                              className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f5c2d6] bg-[#fdf2f8] text-[0.7rem] text-[#be185d] hover:bg-[#fee2e2]"
                              aria-label="Delete this chat"
                            >
                              🗑️
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {historyView === "journal" && (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-[#e9e0f0] bg-white px-3 py-2">
                        <p className="mb-1 text-[var(--text-caption)] font-medium text-[#4b3b5a]">
                          Period log
                        </p>
                        {periodEntries.length === 0 ? (
                          <p className="text-[var(--text-caption)] text-[#9a8d98]">
                            No period days logged yet. Use the period buttons above to add one.
                          </p>
                        ) : (
                          <ul className="space-y-1 text-[var(--text-caption)] text-[#7a6d7a]">
                            {periodEntries.map((p) => (
                              <li key={p.id} className="flex items-center justify-between">
                                <span>
                                  {new Date(p.date).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-500">
                                  {p.flow}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="space-y-2">
                        {visibleJournalEntries.length === 0 ? (
                          <p className="text-center text-[var(--text-small)] text-[#7a6d7a]">
                            {showSearch && query
                              ? `No journal entries match "${searchQuery.trim()}".`
                              : "No journal entries yet. Use Body check-in, Cycle snapshot, or Reflect to add one."}
                          </p>
                        ) : (
                          visibleJournalEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-2xl border border-[#e9e0f0] bg-white px-3 py-2"
                            >
                              <div className="mb-1 flex items-center justify-between text-[var(--text-caption)] text-[#7a6d7a]">
                                <span>
                                  {entry.type === "checkin"
                                    ? "Body check-in"
                                    : entry.type === "snapshot"
                                    ? "Cycle snapshot"
                                    : "Reflection"}
                                </span>
                                <span>
                                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              <p className="text-[var(--text-small)] text-[#2d2430]">
                                {entry.text}
                              </p>
                              {entry.tags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1 text-[0.7rem] text-[#9a8d98]">
                                  {entry.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-full bg-[#f5f3ff] px-2 py-0.5"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                messages.length === 0 ? (
                  <div className="rounded-2xl bg-gradient-to-br from-[#fdf2f8]/90 to-[#faf5ff]/90 p-4 ring-1 ring-pink-200/40">
                    {showSearch ? (
                      <p className="text-[var(--text-small)] leading-[var(--text-small--line)] text-[#5c4d5a]">
                        No messages yet. Ask something, then you can search your chat history here.
                      </p>
                    ) : (
                      <>
                        <p className="font-medium text-[#5c4d5a] text-[var(--text-small)] leading-[var(--text-small--line)]">
                          Try asking:
                        </p>
                        <ul className="mt-2 space-y-1.5 pl-0 text-[#7a6d7a] text-[var(--text-caption)] leading-[var(--text-caption--line)] [list-style:none]">
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#f9a8d4]" />
                            What’s normal during my period?
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#f9a8d4]" />
                            My discharge looks different—should I worry?
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#f9a8d4]" />
                            We’re trying to get pregnant—what should I focus on?
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#c4b5fd]" />
                            How do I avoid UTIs and STIs?
                          </li>
                        </ul>
                      </>
                    )}
                  </div>
                ) : null
              )}

              {!showEducation && !showHistory && !showDashboard &&
                (filteredMessages.length === 0 && searchQuery.trim() ? (
                  <p className="py-4 text-center text-[#7a6d7a] text-[var(--text-small)]">
                    No messages match &quot;{searchQuery.trim()}&quot;
                  </p>
                ) : (
                  <>
                    {query && (
                      <p className="sticky top-0 z-10 rounded-md bg-gradient-to-r from-[#fdf2f8]/95 to-[#f5f3ff]/95 px-2 py-1 text-center text-[0.7rem] text-[#5c4d5a] backdrop-blur-sm">
                        {filteredMessages.length} of {messages.length} messages
                      </p>
                    )}
                    {filteredMessages.map((m, index) => (
                      <div
                        key={m.id}
                        ref={query && index === 0 ? firstMatchRef : null}
                        className={`flex ${
                          m.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div className="max-w-[82%] space-y-2 break-words">
                          <div
                            className={`w-full rounded-2xl px-4 py-2.5 text-[var(--text-small)] leading-[var(--text-small--line)] whitespace-pre-line break-words ${
                              m.role === "user"
                                ? "bg-gradient-to-br from-[#ec4899] via-[#c084fc] to-[#a78bfa] text-white shadow-[0_4px_18px_rgba(236,72,153,0.35)]"
                                : "bg-gradient-to-br from-[#fdf2f8] to-[#f5f3ff] text-[#2d2430] ring-1 ring-pink-200/50"
                            }`}
                          >
                            {m.imagePreview && (
                              <img
                                src={m.imagePreview}
                                alt="Attached"
                                className="mb-2 max-h-40 rounded-xl object-cover"
                              />
                            )}
                            {(() => {
                              const doctorData =
                                m.places?.length ?
                                  { places: m.places, location: m.placesLocation ?? "" }
                                : (m.role === "assistant" && m.content ? parseDoctorListFromContent(m.content) : null);
                              return m.role === "assistant" && doctorData && doctorData.places.length > 0 ? (
                              <div className="space-y-3">
                                <p className="text-[#5c4d5a]">
                                  I can&apos;t personally vouch for anyone, but here are some options around {doctorData.location || "you"} you can check out:
                                </p>
                                <ul className="space-y-3">
                                  {doctorData.places.map((p, i) => (
                                    <li
                                      key={i}
                                      className="rounded-xl border border-pink-200/60 bg-white/95 p-3 shadow-[0_2px_12px_rgba(249,168,212,0.12)]"
                                    >
                                      <p className="font-semibold text-[#2d2430]">{p.name}</p>
                                      {p.address && (
                                        <p className="mt-1 text-[0.8125rem] leading-snug text-[#7a6d7a]">
                                          {p.address}
                                        </p>
                                      )}
                                      <a
                                        href={p.mapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#fdf2f8] to-[#f5f3ff] px-2.5 py-1.5 text-[0.8125rem] font-medium text-[#be185d] ring-1 ring-pink-200/60 transition hover:from-[#fce7f3] hover:to-[#ede9fe] hover:ring-pink-300/50"
                                      >
                                        <span aria-hidden>📍</span>
                                        Open in Maps
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                                <p className="text-[0.8125rem] text-[#7a6d7a]">
                                  Always double-check reviews, opening hours, and your insurance/coverage before you book.
                                </p>
                              </div>
                            ) : (
                              m.content !== "(image attached)" &&
                              renderMessageContent(m.content, query ? searchQuery.trim() : "", m.role === "user")
                            );
                            })()}
                          </div>
                          {m.mapQuery && process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY && (
                            <div className="overflow-hidden rounded-2xl border border-pink-200/50 bg-white shadow-[0_2px_14px_rgba(249,168,212,0.1)]">
                              <p className="border-b border-pink-100/80 bg-gradient-to-r from-[#fdf2f8] to-[#faf5ff] px-3 py-2 text-[0.75rem] font-medium text-[#5c4d5a]">
                                📍 Nearby on map
                              </p>
                              <iframe
                                title={`Map for ${m.mapQuery}`}
                                src={`https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY}&q=${encodeURIComponent(
                                  m.mapQuery,
                                )}`}
                                width="100%"
                                height="220"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="block"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                ))}
            </div>

            <footer className="shrink-0 border-t border-pink-100/80 bg-gradient-to-r from-[#fdf2f8]/90 to-[#faf5ff]/90 px-5 py-3.5 backdrop-blur-sm">
              {imagePreview && (
                <div className="mb-3 flex items-center gap-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-12 w-12 rounded-xl object-cover ring-1 ring-[#e9e0f0]"
                  />
                  <span className="text-[#7a6d7a] text-[var(--text-caption)] leading-[var(--text-caption--line)]">
                    Image attached
                  </span>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="ml-1 rounded-lg px-2 py-1 text-[var(--text-caption)] text-[#be3a5c] hover:bg-[#fce7ef]/80"
                  >
                    Remove
                  </button>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  if (showSearch) {
                    e.preventDefault();
                    return;
                  }
                  handleSend(e);
                }}
                className="flex min-h-0 shrink-0 items-center gap-2 sm:gap-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  aria-label="Upload image"
                />
                {!showSearch && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#e9e0f0] bg-white text-[#7a6d7a] hover:bg-[#f5f3ff] hover:text-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-[#c4b5fd]/40"
                    title="Attach image"
                    aria-label="Attach image"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
                <input
                  ref={searchInputRef}
                  type="text"
                  value={showSearch ? searchQuery : input}
                  onChange={(e) => (showSearch ? setSearchQuery(e.target.value) : setInput(e.target.value))}
                  placeholder={
                    showSearch
                      ? isNarrowScreen
                        ? "Search"
                        : "Search everything"
                      : isNarrowScreen
                        ? inputPromptsShort
                        : inputPrompts[placeholderIndex]
                  }
                  autoComplete={showSearch ? "off" : undefined}
                  className="h-10 min-h-10 max-h-10 min-w-[7rem] flex-1 rounded-2xl border border-[#e9e0f0] bg-white px-3 sm:px-4 py-2 text-[#2d2430] outline-none placeholder:text-[#5c4d5a] focus:border-[#a78bfa] focus:ring-2 focus:ring-[#c4b5fd]/40 text-[var(--text-small)] leading-[var(--text-small--line)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (showSearch) {
                      setShowSearch(false);
                      setSearchQuery("");
                    } else {
                      setShowSearch(true);
                    }
                  }}
                  className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-[#e9e0f0] bg-white px-2.5 py-2.5 text-[#5c4d5a] hover:bg-[#f5f3ff] hover:text-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-[#c4b5fd]/40 sm:px-3"
                  title={showSearch ? "Close search" : "Search everything"}
                  aria-label={showSearch ? "Close search" : "Search everything"}
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="hidden text-[var(--text-caption)] sm:inline">{showSearch ? "Close" : "Search"}</span>
                </button>
                {!showSearch && (
                  <button
                    type="submit"
                    disabled={isLoading || (!input.trim() && !imageFile)}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#c2417a] to-[#9333ea] px-3 py-2.5 font-medium text-white shadow-[0_4px_14px_rgba(194,65,122,0.3)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 text-[var(--text-small)] leading-[var(--text-small--line)] sm:px-5"
                  >
                    {isLoading ? "…" : "Send"}
                  </button>
                )}
              </form>
              {error && (
                <p className="mt-2 text-[#be3a5c] text-[var(--text-caption)] leading-[var(--text-caption--line)]">
                  {error}
                </p>
              )}
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
