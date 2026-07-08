"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useChat, Message } from "@/context/ChatContext";
import { useSession } from "next-auth/react";
import ProfileMenu from "@/components/ProfileMenu";
import NotificationBell from "@/components/NotificationBell";
import ConversationMessage from "@/components/ConversationMessage";
import CounselorRating from "@/components/CounselorRating";

// Full pool of suggestion cards — 4 are randomly picked each page load
const ALL_SUGGESTIONS = [
  { icon: "🎓", label: "Admissions", prompt: "What are the admission requirements for a CS Master's at NUS?", desc: "Entry requirements for top universities" },
  { icon: "🛂", label: "Visa", prompt: "What are the student visa requirements for the UK?", desc: "Visa types, documents & timelines" },
  { icon: "💰", label: "Scholarships", prompt: "Am I eligible for a full scholarship at a Canadian university?", desc: "Merit-based & need-based funding" },
  { icon: "📊", label: "Compare Universities", prompt: "Compare NTU, NUS, and University of Melbourne for an MBA.", desc: "Rankings, tuition & program details" },
  { icon: "💸", label: "Tuition Fees", prompt: "What is the total cost of studying an MBA at a UK university?", desc: "Fees, living costs & budgeting" },
  { icon: "📅", label: "Deadlines", prompt: "What are the application deadlines for Fall 2025 intake at MIT?", desc: "Intake windows & application rounds" },
  { icon: "🌏", label: "Country Guide", prompt: "What countries are best for international students on a budget?", desc: "Cost of living vs. education quality" },
  { icon: "🤝", label: "Talk to Counselor", prompt: "Connect me to a human counselor for my application.", desc: "Escalate to a real admissions expert" },
  { icon: "📝", label: "SOP Tips", prompt: "How do I write a strong statement of purpose for Oxford?", desc: "Essays, personal statements & tips" },
  { icon: "📈", label: "GPA & IELTS", prompt: "What GPA and IELTS score do I need for Harvard's MBA program?", desc: "Minimum score requirements" },
  { icon: "🏆", label: "Top Programs", prompt: "What are the top 5 universities for Computer Science in Canada?", desc: "Best-ranked programs by subject" },
  { icon: "🏠", label: "Living Costs", prompt: "What is the monthly cost of living for a student in Singapore?", desc: "Budget planning for international life" },
  { icon: "🇩🇪", label: "Study in Germany", prompt: "Can I study for free in Germany as an international student?", desc: "Tuition-free universities in Europe" },
  { icon: "🇦🇺", label: "Study in Australia", prompt: "What are the top universities in Australia for engineering?", desc: "Australian study options & visa" },
  { icon: "🇺🇸", label: "Study in the USA", prompt: "What is the F-1 student visa process for the United States?", desc: "US visa, OPT & CPT explained" },
  { icon: "🎯", label: "Profile Evaluation", prompt: "I have a 3.2 GPA and 6.5 IELTS. Which universities can I target in the UK?", desc: "Find universities that match your profile" },
  { icon: "📄", label: "Document Checklist", prompt: "What documents do I need to apply to universities in the Netherlands?", desc: "Application document requirements" },
  { icon: "🔁", label: "Transfer Credits", prompt: "Can I transfer my undergraduate credits to a university in the US?", desc: "Credit transfer & recognition policies" },
  { icon: "💼", label: "Work While Studying", prompt: "How many hours can an international student work in Canada per week?", desc: "Part-time work rules abroad" },
  { icon: "🩺", label: "Health Insurance", prompt: "Do international students need health insurance in Germany?", desc: "Mandatory insurance requirements" },
  { icon: "🏅", label: "Rankings", prompt: "What is the QS ranking of Imperial College London for Medicine?", desc: "University and subject rankings" },
  { icon: "🤖", label: "AI & Data Science", prompt: "What are the best universities for Artificial Intelligence in Europe?", desc: "Tech & AI programs globally" },
  { icon: "📡", label: "Intake Seasons", prompt: "Which universities offer a January intake for international students?", desc: "Spring, Fall & Winter intakes" },
  { icon: "🌐", label: "English Programs", prompt: "Which universities in South Korea offer programs fully in English?", desc: "Non-English countries, English courses" },
];

export default function ChatPage() {
  const { data: session, status } = useSession();
  const userName = session?.user?.name || "Student";
  const router = useRouter();
  const isLoggedIn = status === "authenticated";

  const { activeSession, updateActiveMessages, updateSessionStatus, isSidebarCollapsed, toggleSidebar } = useChat();
  const messages = activeSession?.messages || [];

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shuffle once on mount, show 4 cards
  const shuffledCards = useMemo(() => {
    const isStudent = !session || (session.user as any)?.role === "STUDENT" || !(session.user as any)?.role;
    const availableSuggestions = isStudent
      ? [...ALL_SUGGESTIONS]
      : [...ALL_SUGGESTIONS].filter(c => c.label !== "Talk to Counselor");
    const shuffled = availableSuggestions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }, [session]);

  // Poll for new messages and status updates for the active session
  useEffect(() => {
    if (!activeSession || !isLoggedIn) return;

    let abortController = new AbortController();

    const interval = setInterval(async () => {
      abortController.abort(); // Cancel previous request if still pending
      abortController = new AbortController();

      try {
        const res = await fetch(`/api/v1/chats`, { signal: abortController.signal });
        if (res.ok) {
          const data = await res.json();
          const cur = (data.sessions || []).find((s: any) => s.id === activeSession.id);
          if (cur) {
            const mappedMsgs = (cur.messages || []).map((m: any) => ({
              role: m.sender_type === "USER" ? "user" : m.sender_type === "COUNSELOR" ? "counselor" : m.sender_type === "SYSTEM" ? "system" : "model",
              content: m.content,
              senderName: m.sender_type === "COUNSELOR" ? cur.counselor?.name || "Counselor" : undefined,
            }));
            // Skip overwriting during active user typing/streaming to prevent race conditions
            if (!isTyping && mappedMsgs.length !== messages.length) {
              updateActiveMessages(() => mappedMsgs);
            }
            if (cur.status !== activeSession.status) {
              updateSessionStatus(activeSession.id, cur.status);
            }
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError' && e.message !== 'Failed to fetch') {
          console.error("Polling error:", e);
        }
      }
    }, 4000);

    return () => {
      abortController.abort();
      clearInterval(interval);
    };
  }, [activeSession?.id, activeSession?.status, messages.length, updateActiveMessages, updateSessionStatus, isLoggedIn, isTyping]);

  // Autofocus the chat input box when the active session changes or streaming finishes
  useEffect(() => {
    if (!isTyping) {
      textareaRef.current?.focus();
    }
  }, [activeSession?.id, isTyping]);

  // Auto-scroll to bottom when messages update, but only if the user is already near the bottom
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Check if the user is close to the bottom (within 150px)
    const threshold = 150;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;

    if (isNearBottom) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Enforce authenticated users only
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Loading Screen
  if (status === "loading") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-[#121212]">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#066AC9] border-t-transparent"></div>
          <p className="text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400">
            Securing Counselor Connection...
          </p>
        </div>
      </div>
    );
  }

  // Block rendering if unauthenticated (redirecting)
  if (!isLoggedIn) {
    return null;
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
      updateActiveMessages((prev) => {
        const newMsgs = [...prev];
        if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].isLoading) {
          newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], isLoading: false };
        }
        return newMsgs;
      });
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
      textareaRef.current.style.overflowY = newHeight >= 120 ? "auto" : "hidden";
    }
  };

  /** Reads an SSE stream from a Response and streams text into the last message */
  const readSSEStream = async (response: Response) => {
    if (!response.body) throw new Error("Readable stream not supported");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiResponse = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text || parsed.id) {
              if (parsed.text) aiResponse += parsed.text;
              updateActiveMessages((prev) => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = {
                  ...msgs[msgs.length - 1],
                  role: "model",
                  content: aiResponse,
                  isLoading: false,
                  ...(parsed.id ? { id: parsed.id } : {})
                };
                return msgs;
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isTyping) return;

    // Check for counselor escalation/cancellation keywords
    const normalizedText = text.toLowerCase();
    const isCancelRequest =
      normalizedText.includes("cancel") &&
      (normalizedText.includes("escalat") || normalizedText.includes("counselor") || normalizedText.includes("human") || normalizedText.includes("takeover"));

    const isStudent = !session || (session.user as any)?.role === "STUDENT" || !(session.user as any)?.role;

    if (isCancelRequest && activeSession?.id && isStudent) {
      fetch(`/api/v1/chats/${activeSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" })
      })
        .then((res) => {
          if (res.ok) {
            updateSessionStatus(activeSession.id, "ACTIVE");
          }
        })
        .catch(e => console.error("Failed to cancel escalation", e));
    } else {
      const isEscalationKeyword =
        normalizedText.includes("counselor") ||
        normalizedText.includes("human assistance") ||
        normalizedText.includes("escalat") ||
        (normalizedText.includes("connect") && normalizedText.includes("human"));

      if (isEscalationKeyword && activeSession?.id && isStudent) {
        fetch(`/api/v1/chats/${activeSession.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PENDING_ESCALATION" })
        })
          .then((res) => {
            if (res.ok) {
              updateSessionStatus(activeSession.id, "PENDING_ESCALATION");
            }
          })
          .catch(e => console.error("Failed to escalate session", e));
      }
    }

    // Wait! If a counselor has "taken over" this chat, we bypass the AI entirely.
    // Instead of sending the message to Gemini, we just save it straight to the PostgreSQL database!
    if (activeSession?.status === "ESCALATED_ACTIVE") {
      const userMessage: Message = { role: "user", content: text };
      updateActiveMessages((prev) => [...prev, userMessage]);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.focus();
      }

      try {
        await fetch(`/api/v1/chats/${activeSession.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "user", content: text }),
        });
      } catch (e) {
        console.error("Failed to post message in takeover mode", e);
      }
      return; // Stop right here, don't talk to AI
    }

    // If the user attached a file (like an essay or transcript), run a special file upload route instead
    if (attachedFile) {
      await handleSendWithFile(text, attachedFile);
      return;
    }

    // NORMAL AI CHAT MODE:
    // 1. Create a message object for the user's text
    const userMessage: Message = { role: "user", content: text };

    // 2. Add the user's text to the screen AND instantly add a blank "loading" bubble for the AI
    updateActiveMessages((prev) => [...prev, userMessage, { role: "model", content: "", isLoading: true }]);

    // 3. Clear the text box so they can type the next message
    setInput("");
    setIsTyping(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Force scroll to bottom immediately on user send action
    setTimeout(() => {
      endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // 4. THIS IS THE MAGIC POST REQUEST! 
      // We are sending ALL previous messages (...messages) PLUS the new one to our backend route.ts
      const response = await fetch("/api/v1/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ messages: [...messages, userMessage], sessionId: activeSession?.id }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        updateActiveMessages((prev) => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: "model", content: `⚠️ **Server Error**: ${errJson.error || response.status}`, isLoading: false };
          return msgs;
        });
        return;
      }
      await readSSEStream(response);
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      updateActiveMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: "model", content: `Error: ${error?.message ?? "Unable to connect."}`, isLoading: false };
        return msgs;
      });
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
      textareaRef.current?.focus();
    }
  };

  const handleSendWithFile = async (text: string, file: File) => {
    const label = `📎 **${file.name}**\n\n${text}`;
    const userMessage: Message = { role: "user", content: label };
    updateActiveMessages((prev) => [...prev, userMessage, { role: "model", content: "", isLoading: true }]);
    setInput("");
    setAttachedFile(null);
    setIsTyping(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("messages", JSON.stringify([...messages, { role: "user", content: text }]));
      if (activeSession?.id) form.append("sessionId", activeSession.id);

      const response = await fetch("/api/v1/chat/file", {
        method: "POST",
        signal: controller.signal,
        body: form,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson.message || errJson.error || `File rejected (${response.status})`;
        updateActiveMessages((prev) => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: "model", content: `⚠️ ${msg}`, isLoading: false };
          return msgs;
        });
        return;
      }
      await readSSEStream(response);
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      updateActiveMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: "model", content: `Error: ${error?.message ?? "Unable to process file."}`, isLoading: false };
        return msgs;
      });
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-full ambient-glow relative overflow-hidden">
      {/* Top Header - UI-005 & UI-006 */}
      <header className="h-[60px] min-h-[60px] flex items-center justify-between px-6 glass-header sticky top-0 z-40 transition-all duration-300">
        <div className="flex items-center gap-3">
          {/* Desktop/Tablet Expand button */}
          <button
            onClick={toggleSidebar}
            title="Expand Sidebar"
            className={`hidden lg:flex p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors cursor-pointer ${isSidebarCollapsed ? "lg:flex" : "lg:hidden"
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7" />
            </svg>
          </button>

          {/* Spacer for mobile menu toggle overlay */}
          <div className="w-8 h-8 lg:hidden"></div>

          <h1 className="text-sm font-semibold text-[#1F2022] dark:text-[#E0E0E0] hidden md:block">
            {activeSession?.title || "AI Admission Counselor"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Light / Dark Toggle */}
          <button
            title="Toggle Light / Dark Mode"
            onClick={() => {
              document.documentElement.classList.toggle("dark");
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 hidden dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
          <NotificationBell />
          <ProfileMenu />
        </div>
      </header>

      {/* Main Chat Canvas */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-8 custom-scrollbar">
        <div className="mx-auto max-w-3xl">
          {messages.length === 0 ? (
            // UI-007: Empty State
            <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
              <div className="text-center max-w-lg mb-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#066AC9]/10 text-[#066AC9] dark:bg-[#066AC9]/20 dark:text-[#0A84FF] text-xs font-bold uppercase tracking-wider mb-4 border border-[#066AC9]/10 shadow-sm animate-pulse">
                  ⚡ AI counselor active
                </div>
                <h2 className="text-3xl font-extrabold text-[#1F2022] dark:text-white tracking-tight leading-tight">
                  Where would you like to study?
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                  Compare global universities, search scholarship requirements, evaluate visas, and connect with counselor experts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                {shuffledCards.map((card, idx) => (
                  <button
                    key={idx}
                    id={`suggestion-btn-${idx}`}
                    aria-label={`Ask: ${card.prompt}`}
                    title={card.prompt}
                    className="flex items-start gap-4 p-4 text-left border border-black/[0.04] dark:border-white/[0.04] rounded-2xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm hover:border-[#066AC9]/50 hover:bg-white dark:hover:bg-[#1A1A1A] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-[2px] transition-all duration-300 ease-in-out cursor-pointer group"
                    onClick={() => handleSend(card.prompt)}
                  >
                    <span className="text-xl mt-0.5 shrink-0 bg-gray-50 dark:bg-white/5 p-2 rounded-xl group-hover:bg-[#066AC9]/10 group-hover:scale-105 transition-all duration-300">{card.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#066AC9] dark:text-[#0A84FF] mb-1">{card.label}</p>
                      <p className="text-sm font-semibold text-[#1F2022] dark:text-gray-100 leading-snug truncate group-hover:text-[#066AC9] transition-colors">{card.prompt}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{card.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // UI-008: Messages
            <div className="space-y-6 pb-28" aria-live="polite" role="log" id="chat-messages-container">
              {messages.map((msg, i) => (
                <ConversationMessage
                  key={i}
                  message={msg}
                  viewer="student"
                  studentName={userName}
                  onSendMessage={handleSend}
                />
              ))}
              <div ref={endOfMessagesRef} />
            </div>
          )}
        </div>
      </div>

      {/* Chat Input Box (Fixed Footer) - UI-009 */}
      <div className="w-full px-4 pb-6 pt-2 bg-gradient-to-t from-white via-white to-transparent dark:from-[#121212] dark:via-[#121212] z-30">
        <div className="mx-auto max-w-3xl">
          {activeSession?.status === "CLOSED" ? (
            <CounselorRating sessionId={activeSession.id} />
          ) : (
            <>
              {/* File attachment chip + PII Warning */}
              {attachedFile && (
                <div className="mb-3 space-y-2">
                  {/* File chip */}
                  <div className="flex items-center gap-2 rounded-xl border border-[#066AC9]/30 bg-[#066AC9]/5 px-3.5 py-2.5 text-sm dark:bg-[#066AC9]/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-[#066AC9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="truncate flex-1 text-[#066AC9] font-semibold">{attachedFile.name}</span>
                    <span className="text-xs text-[#066AC9]/80 shrink-0 font-mono">{(attachedFile.size / 1024).toFixed(0)} KB</span>
                    <button
                      title="Remove attachment"
                      aria-label="Remove attached file"
                      onClick={() => setAttachedFile(null)}
                      className="ml-1 shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* PII warning banner */}
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-300/40 bg-amber-500/5 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900 dark:text-amber-200">PII Security Scan Active</p>
                      <p className="mt-0.5 text-amber-700 dark:text-amber-300/80 leading-relaxed font-medium">
                        This file is scanned in-memory only. If any personal identifiers (e.g. passport numbers, national IDs, or contact info) are found, the file will be <strong>denied and deleted instantly</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setAttachedFile(f);
                  // Reset so same file can be re-selected
                  e.target.value = "";
                }}
              />

              <div className="relative glass-input rounded-[26px] border border-black/5 dark:border-white/10 shadow-sm focus-within:shadow-md focus-within:border-[#066AC9]/70 focus-within:ring-1 focus-within:ring-[#066AC9]/30 transition-all duration-300">
                {/* Paperclip button */}
                <button
                  id="chat-attach-button"
                  aria-label="Attach a file (PDF, DOCX, TXT)"
                  title="Attach file (PDF, DOCX, TXT — max 5 MB)"
                  disabled={isTyping}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-3.5 top-[26px] -translate-y-1/2 text-gray-400 hover:text-[#066AC9] disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                <textarea
                  id="chat-input-textarea"
                  aria-label="Type your message to the AI Admission Counselor"
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  placeholder={attachedFile ? "Ask about this document…" : "Ask about admissions, visas, or fees..."}
                  className="w-full resize-none overflow-hidden bg-transparent py-4 pl-12 pr-14 text-[#1F2022] dark:text-white placeholder-gray-400 focus:outline-none disabled:opacity-70 transition-all"
                  rows={1}
                  style={{ minHeight: "52px", maxHeight: "120px" }}
                />

                {isTyping ? (
                  <button
                    id="chat-stop-button"
                    aria-label="Stop generating"
                    title="Stop generating"
                    onClick={handleStop}
                    className="absolute right-3.5 top-[26px] -translate-y-1/2 rounded-full p-1.5 bg-[#1F2022] dark:bg-white text-white dark:text-[#1F2022] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <rect x="5" y="5" width="10" height="10" rx="1" />
                    </svg>
                  </button>
                ) : (
                  <button
                    id="chat-send-button"
                    aria-label="Send message"
                    title="Send message"
                    disabled={!input.trim() && !attachedFile}
                    onClick={() => handleSend(input)}
                    className="absolute right-3.5 top-[26px] -translate-y-1/2 rounded-full p-1.5 bg-[#066AC9] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <p id="legal-disclaimer-footer" className="text-center text-xs text-[#989898] mt-2">
          By using this service, you consent to data processing per the GDPR and Indian DPDP Act. <br className="md:hidden" />
          Attached files are never stored — they are scanned for PII and used only for this conversation.
        </p>
      </div>
    </div>
  );
}
