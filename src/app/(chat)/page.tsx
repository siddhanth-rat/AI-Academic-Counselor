"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat, Message } from "@/context/ChatContext";

export default function ChatPage() {
  const { activeSession, updateActiveMessages } = useChat();
  const messages = activeSession?.messages || [];
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isTyping) return;
    
    const userMessage: Message = { role: "user", content: text };
    
    // Append user message and loading AI placeholder to context
    updateActiveMessages((prev) => [...prev, userMessage, { role: "model", content: "", isLoading: true }]);
    setInput("");
    setIsTyping(true);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch("/api/v1/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok || !response.body) throw new Error("Failed to fetch");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      // Process SSE Stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                aiResponse += parsed.text;
                // Dynamically update the streaming text in active session
                updateActiveMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = { role: "model", content: aiResponse, isLoading: false };
                  return newMsgs;
                });
              }
            } catch (e) {
              console.error("SSE Parse Error", e);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      updateActiveMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: "model", content: "Error: Unable to connect to the server.", isLoading: false };
        return newMsgs;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#121212]">
      {/* Top Header - UI-005 & UI-006 */}
      <header className="h-[60px] min-h-[60px] flex items-center justify-between border-b border-[#EDEDED] px-4 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 lg:hidden"></div> {/* Spacer for hamburger */}
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

          {/* Profile Dropdown Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title="Account Options" 
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#066AC9]/10 hover:bg-[#066AC9]/20 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#066AC9]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 shadow-xl py-2 z-50 text-sm">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    // Reset to guest mode
                    window.location.href = "/";
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Use as Guest</span>
                </button>

                <Link
                  href="/login"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-[#066AC9] font-medium hover:bg-gray-100 dark:hover:bg-white/5 text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#066AC9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In / Portal</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Chat Canvas */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 custom-scrollbar">
        <div className="mx-auto max-w-3xl">
          {messages.length === 0 ? (
            // UI-007: Empty State
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <div className="w-16 h-16 rounded-full bg-[#066AC9] mb-8 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                G
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {[
                  "What are the visa requirements for the UK?",
                  "Am I eligible for a 100% scholarship?",
                  "What is the fee for an MBA?",
                  "Connect me to a counselor."
                ].map((suggestion, idx) => (
                  <button 
                    key={idx}
                    id={`suggestion-btn-${idx}`}
                    aria-label={`Ask: ${suggestion}`}
                    className="p-4 text-left border border-[#EDEDED] rounded-xl bg-white hover:shadow-lg transition-shadow duration-300 dark:bg-[#1A1A1A] dark:border-gray-800 dark:text-gray-200"
                    onClick={() => { handleSend(suggestion); }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // UI-008: Messages
            <div className="space-y-6 pb-24" aria-live="polite" role="log" id="chat-messages-container">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div 
                    id={`message-${i}`}
                    className={`max-w-[85%] md:max-w-[75%] px-4 py-3 text-sm md:text-base shadow-sm
                      ${msg.role === "user" 
                        ? "bg-[#066AC9] text-white rounded-[20px] rounded-br-none" 
                        : "bg-[#F7F7F7] text-[#1F2022] rounded-[20px] rounded-bl-none dark:bg-[#1A1A1A] dark:text-[#E0E0E0] border border-gray-100 dark:border-gray-800"
                      }`}
                  >
                    {msg.isLoading ? (
                      <div className="flex items-center space-x-1 h-5">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    ) : msg.role === "model" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={endOfMessagesRef} />
            </div>
          )}
        </div>
      </div>

      {/* Chat Input Box (Fixed Footer) - UI-009 */}
      <div className="w-full px-4 pb-6 pt-2 bg-gradient-to-t from-white via-white to-transparent dark:from-[#121212] dark:via-[#121212]">
        <div className="mx-auto max-w-3xl relative">
          <textarea
            id="chat-input-textarea"
            aria-label="Type your message to the AI Admission Counselor"
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            placeholder="Ask about admissions, visas, or fees..."
            className="w-full resize-none overflow-hidden rounded-[24px] border border-[#B3B3B3] bg-white py-3 pl-4 pr-12 text-[#1F2022] placeholder-[#989898] focus:border-[#066AC9] focus:shadow-[0px_0px_24px_0px_rgba(6,106,201,0.3)] focus:outline-none dark:border-gray-700 dark:bg-[#1A1A1A] dark:text-white disabled:opacity-70"
            rows={1}
            style={{ minHeight: "50px", maxHeight: "120px" }}
          />
          <button 
            id="chat-send-button"
            aria-label="Send message"
            disabled={!input.trim() || isTyping}
            onClick={() => handleSend(input)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 bg-[#066AC9] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <p id="legal-disclaimer-footer" className="text-center text-xs text-[#989898] mt-2">
          By using this service, you consent to data processing per the GDPR and Indian DPDP Act. <br className="md:hidden" />
          I am an AI assistant. My answers do not constitute a legal guarantee of admission or visa approval.
        </p>
      </div>
    </div>
  );
}
