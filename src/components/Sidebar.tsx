"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useChat } from "@/context/ChatContext";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // Mobile state
  const [searchQuery, setSearchQuery] = useState("");
  const { sessions, activeSessionId, createNewChat, selectSession, deleteSession } = useChat();

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-[260px] flex flex-col bg-[#EDEDED] transition-transform duration-300 ease-in-out dark:bg-[#1A1A1A]
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Header section */}
        <div className="p-4 space-y-3">
          {/* UI-001: New Chat Button */}
          <button 
            id="sidebar-new-chat-btn"
            aria-label="Start a new chat"
            onClick={() => {
              createNewChat();
              setIsOpen(false);
            }}
            className="flex w-full items-center justify-start gap-3 rounded-xl bg-[#066AC9] px-4 py-3 text-white transition-transform duration-200 hover:scale-[0.97] hover:bg-[#055AAB]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span className="font-medium text-sm">New Chat</span>
          </button>

          {/* UI-002: Universal Sidebar Search Bar */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-4 w-4 text-[#B3B3B3]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="sidebar-search-input"
              aria-label="Search past chats"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full rounded-lg border border-[#B3B3B3] bg-white py-2 pl-9 pr-3 text-sm text-[#1F2022] placeholder-[#B3B3B3] transition-all focus:border-[#066AC9] focus:shadow-[0px_0px_13px_0px_rgba(6,106,201,0.3)] focus:outline-none dark:border-gray-600 dark:bg-[#2C2C2C] dark:text-white"
            />
          </div>
        </div>

        {/* Scrollable History List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          <div className="mb-6">
            <h3 className="mb-2 text-xs font-semibold text-[#989898]">Your Conversations</h3>
            <div className="space-y-1">
              {filteredSessions.length === 0 ? (
                <p className="text-xs text-gray-400 p-2">No chats found.</p>
              ) : (
                filteredSessions.map((sess) => {
                  const isActive = sess.id === activeSessionId;
                  return (
                    <div
                      key={sess.id}
                      className={`group flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                        isActive
                          ? "bg-black/10 text-[#1F2022] font-semibold dark:bg-white/10 dark:text-white"
                          : "text-[#1F2022] hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5"
                      }`}
                      onClick={() => {
                        selectSession(sess.id);
                        setIsOpen(false);
                      }}
                    >
                      <span className="truncate flex-1 pr-2">{sess.title}</span>
                      <button
                        aria-label="Delete chat"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(sess.id);
                        }}
                        className="hidden opacity-60 hover:opacity-100 group-hover:block text-red-500 p-1"
                      >
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        
        {/* Portal Switcher Link */}
        <div className="border-t border-[#B3B3B3]/30 p-4">
          <Link href="/login" className="flex w-full items-center gap-3 rounded-xl bg-black/5 px-4 py-3 text-[#1F2022] hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 text-sm font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            <span>Switch Account / Login</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Hamburger */}
      <button 
        id="mobile-sidebar-toggle"
        aria-label="Open sidebar menu"
        aria-expanded={isOpen}
        className="fixed top-4 left-4 z-30 rounded-md p-2 hover:bg-black/5 lg:hidden"
        onClick={() => setIsOpen(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
}
