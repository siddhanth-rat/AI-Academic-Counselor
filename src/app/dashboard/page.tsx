"use client";

import React, { useState, useEffect, useRef } from "react";
import ConversationMessage from "@/components/ConversationMessage";

interface Message {
  role: "user" | "model" | "counselor" | "system";
  content: string;
  senderName?: string;
}

interface Escalation {
  id: string;
  user: string;
  topic: string;
  status: "PENDING" | "ACTIVE";
  waitTime: string;
  counselor: string;
  messages: Message[];
}

export default function DashboardPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMuted(localStorage.getItem("muteEscalationAlerts") === "true");
  }, []);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem("muteEscalationAlerts", String(newMuted));
    // Dispatch event so StaffNavigation can hear the update immediately
    window.dispatchEvent(new Event("muteToggle"));
  };

  // 1. Fetch Escalations dynamically
  const fetchEscalations = async () => {
    try {
      const res = await fetch("/api/v1/counselor/escalations");
      if (res.ok) {
        const data = await res.json();
        setEscalations(data.escalations || []);
      }
    } catch (e) {
      console.error("Failed to fetch escalations:", e);
    }
  };

  // Poll for active escalations and live messages
  useEffect(() => {
    fetchEscalations();
    const interval = setInterval(fetchEscalations, 3000);
    return () => clearInterval(interval);
  }, []); 

  const activeEscalation = escalations.find((e) => e.id === selectedSessionId);

  // Auto-scroll chat window to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeEscalation?.messages]);

  // 2. Take over session
  const handleTakeover = async (sessionId: string) => {
    try {
      const res = await fetch("/api/v1/counselor/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "takeover" }),
      });
      if (res.ok) {
        setSelectedSessionId(sessionId);
        await fetchEscalations();
      }
    } catch (e) {
      console.error("Takeover error:", e);
    }
  };

  // 3. Leave/Release session
  const handleLeave = async (sessionId: string) => {
    try {
      const res = await fetch("/api/v1/counselor/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "leave" }),
      });
      if (res.ok) {
        setSelectedSessionId(null);
        await fetchEscalations();
      }
    } catch (e) {
      console.error("Leave error:", e);
    }
  };

  // 4. Send Message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedSessionId) return;

    const text = inputText;
    setInputText("");

    try {
      const res = await fetch("/api/v1/counselor/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSessionId, content: text }),
      });
      if (res.ok) {
        await fetchEscalations();
      }
    } catch (e) {
      console.error("Send message error:", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render Taken Over Chat Interface
  if (selectedSessionId && activeEscalation) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#121212]">
        <header className="p-4 border-b border-[#EDEDED] dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#1A1A1A]">
          <div>
            <h1 className="font-bold text-sm text-[#1F2022] dark:text-white">Active takeover: {activeEscalation.user}</h1>
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
              You have taken over this session
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedSessionId(null)}
              className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 text-[#1F2022] dark:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Back to Queue
            </button>
            <button 
              onClick={() => handleLeave(selectedSessionId)}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Release Chat
            </button>
          </div>
        </header>
        
        {/* Chat Messages Panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/50 dark:bg-black/5">
          {activeEscalation.messages.length === 0 ? (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-8">No messages in this chat yet.</p>
          ) : (
            activeEscalation.messages.map((msg, idx) => (
              <ConversationMessage
                key={idx}
                message={msg}
                viewer="counselor"
                studentName={activeEscalation.user}
                counselorName={activeEscalation.counselor}
              />
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input panel */}
        <div className="p-4 border-t border-[#EDEDED] dark:border-gray-800 bg-white dark:bg-[#121212]">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message as a counselor..." 
              className="flex-1 px-4 py-2.5 border border-[#B3B3B3] rounded-xl focus:outline-none focus:border-[#066AC9] dark:bg-[#1A1A1A] dark:border-gray-700 dark:text-white text-sm"
            />
            <button 
              onClick={handleSendMessage}
              className="px-6 py-2 bg-[#066AC9] hover:bg-[#055AAB] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Queue Table
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2022] dark:text-white">Active Escalations</h1>
          <p className="text-sm text-[#989898] mt-1">Monitor students who have requested human counselor assistance.</p>
        </div>
        <button 
          onClick={fetchEscalations}
          className="px-4 py-2 border border-gray-200 dark:border-gray-850 hover:bg-black/5 dark:hover:bg-white/5 text-[#1F2022] dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#EDEDED] dark:border-gray-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F7F7] dark:bg-[#2C2C2C] text-[#1F2022] dark:text-gray-300">
            <tr>
              <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">User (Student)</th>
              <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Topic</th>
              <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Wait Time</th>
              <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Status</th>
              <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDEDED] dark:divide-gray-800">
            {escalations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 font-medium">
                  📭 No active student escalations at the moment.
                </td>
              </tr>
            ) : (
              escalations.map((esc) => (
                <tr key={esc.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-semibold text-[#1F2022] dark:text-white">{esc.user}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">{esc.topic}</td>
                  <td className={`px-6 py-4 font-semibold ${esc.status === "PENDING" ? "text-red-500" : "text-gray-400"}`}>{esc.waitTime}</td>
                  <td className="px-6 py-4">
                    {esc.status === "PENDING" ? (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-wider">Waiting</span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        In Progress ({esc.counselor})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {esc.status === "PENDING" ? (
                      <button 
                        onClick={() => handleTakeover(esc.id)}
                        className="px-3.5 py-1.5 bg-[#066AC9] hover:bg-[#055AAB] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Takeover
                      </button>
                    ) : (
                      <button 
                        onClick={() => setSelectedSessionId(esc.id)}
                        className="px-3.5 py-1.5 border border-[#066AC9] hover:bg-[#066AC9]/5 text-[#066AC9] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button 
        onClick={toggleMute}
        className="fixed bottom-6 left-6 md:left-[280px] flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#1A1A1A] border border-[#EDEDED] dark:border-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-white/5 transition-all z-50 text-[#1F2022] dark:text-white text-xl cursor-pointer"
        title={isMuted ? "Unmute notifications" : "Mute notifications"}
      >
        {isMuted ? "🔕" : "🔔"}
      </button>
    </div>
  );
}
