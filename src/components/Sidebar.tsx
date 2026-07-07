"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useChat } from "@/context/ChatContext";
import { useSession } from "next-auth/react";

export default function Sidebar() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const userEmail = session?.user?.email || "";
  const userName = session?.user?.name || userEmail.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();
  const userRole = (session?.user as { role?: "STUDENT" | "COUNSELOR" | "ADMIN" } | undefined)?.role || "STUDENT";

  const [isOpen, setIsOpen] = useState(false); // Mobile state
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const { sessions, activeSessionId, createNewChat, selectSession, deleteSession, renameSession, isSidebarCollapsed, toggleSidebar } = useChat();

  const handleRenameSubmit = (id: string, e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    if (editTitle.trim()) {
      renameSession(id, editTitle);
    }
    setEditingSessionId(null);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [shortlist, setShortlist] = useState<any[]>([]);

  React.useEffect(() => {
    if (!isLoggedIn || userRole !== "STUDENT") return;

    const fetchShortlist = () => {
      fetch("/api/v1/user/student-profile")
        .then(res => res.json())
        .then(data => {
          if (data?.studentProfile?.shortlisted_programs) {
            setShortlist(data.studentProfile.shortlisted_programs);
          } else {
            setShortlist([]);
          }
        })
        .catch(err => console.error("Error loading shortlist in sidebar:", err));
    };

    fetchShortlist();
    const interval = setInterval(fetchShortlist, 4000);
    return () => clearInterval(interval);
  }, [isLoggedIn, userRole]);

  React.useEffect(() => {
    if (shortlist.length > 0 && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }

      shortlist.forEach(p => {
        if (!p.program.deadline) return;
        const deadlineDate = new Date(p.program.deadline);
        const diffTime = deadlineDate.getTime() - Date.now();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if ([1, 3, 7].includes(diffDays)) {
          if (Notification.permission === "granted") {
            const heading = `⚠️ Upcoming Application Deadline!`;
            const options = {
              body: `Your shortlisted program "${p.program.program_name}" at ${p.program.institution.name} closes in ${diffDays} day${diffDays !== 1 ? "s" : ""} (${deadlineDate.toLocaleDateString()}). Apply now!`,
            };
            new Notification(heading, options);
          }
        }
      });
    }
  }, [shortlist]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-[60] h-screen w-[260px] flex flex-col bg-[#EDEDED] transition-transform duration-300 ease-in-out dark:bg-[#1A1A1A] border-r border-[#EDEDED]/50 dark:border-gray-800
          ${isOpen ? "translate-x-0" : "-translate-x-full"} ${isSidebarCollapsed ? "lg:-translate-x-full" : "lg:translate-x-0"}`}
      >
        {/* Header section */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">AI Counselor</span>
            {/* Desktop Collapse Button */}
            <button
              onClick={toggleSidebar}
              title="Collapse Sidebar"
              className="hidden lg:flex p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7" />
              </svg>
            </button>
            {/* Mobile close button */}
            <button
              onClick={() => setIsOpen(false)}
              title="Close Sidebar"
              className="lg:hidden p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* UI-001: New Chat Button */}
          <button
            id="sidebar-new-chat-btn"
            aria-label="Start a new chat"
            title="Start a new chat"
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
          {isLoggedIn && (
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-4 w-4 text-[#B3B3B3]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="sidebar-search-input"
                aria-label="Search past chats"
                title="Search past chats"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full rounded-lg border border-[#B3B3B3] bg-white py-2 pl-9 pr-3 text-sm text-[#1F2022] placeholder-[#B3B3B3] transition-all focus:border-[#066AC9] focus:shadow-[0px_0px_13px_0px_rgba(6,106,201,0.3)] focus:outline-none dark:border-gray-600 dark:bg-[#2C2C2C] dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Scrollable History List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          {isLoggedIn ? (
            <>
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
                        className={`group flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer ${isActive
                            ? "bg-black/10 text-[#1F2022] font-semibold dark:bg-white/10 dark:text-white"
                            : "text-[#1F2022] hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5"
                          }`}
                        onClick={() => {
                          if (editingSessionId === sess.id) return;
                          selectSession(sess.id);
                          setIsOpen(false);
                        }}
                      >
                        {editingSessionId === sess.id ? (
                          <input
                            type="text"
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleRenameSubmit(sess.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameSubmit(sess.id, e);
                              if (e.key === "Escape") setEditingSessionId(null);
                            }}
                            className="w-full bg-transparent border-b border-[#066AC9] outline-none text-sm font-semibold px-1 py-0.5"
                          />
                        ) : (
                          <>
                            <span className="truncate flex-1 pr-2">{sess.title}</span>
                            <div className="hidden group-hover:flex items-center gap-1 opacity-60 hover:opacity-100">
                              <button
                                aria-label="Rename chat"
                                title="Rename conversation"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSessionId(sess.id);
                                  setEditTitle(sess.title);
                                }}
                                className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white p-1 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 20h9"></path>
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                              </button>
                              <button
                                aria-label="Delete chat"
                                title="Delete conversation"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSession(sess.id);
                                }}
                                className="text-red-500 p-1 transition-colors hover:text-red-600"
                              >
                                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Shortlist Application Deadlines Widget */}
            {userRole === "STUDENT" && shortlist.length > 0 && (
              <div className="mt-6 pt-4 border-t border-[#B3B3B3]/20 dark:border-gray-800">
                <h3 className="mb-3 text-xs font-semibold text-[#989898] flex items-center gap-1.5">
                  📅 Shortlist Deadlines
                </h3>
                <div className="space-y-2">
                  {shortlist.map((item) => {
                    if (!item.program.deadline) return null;
                    const deadlineDate = new Date(item.program.deadline);
                    const diffTime = deadlineDate.getTime() - Date.now();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    const isUrgent = diffDays > 0 && diffDays <= 7;
                    const isSoon = diffDays > 7 && diffDays <= 30;
                    
                    let badgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400";
                    let label = `${diffDays} days left`;
                    
                    if (diffDays < 0) {
                      badgeClass = "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
                      label = "Closed";
                    } else if (isUrgent) {
                      badgeClass = "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 font-bold animate-pulse";
                      label = `${diffDays}d left!`;
                    } else if (isSoon) {
                      badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 font-bold";
                      label = `${diffDays}d left`;
                    }

                    return (
                      <div key={item.id} className="bg-white/50 dark:bg-[#202020]/30 p-2.5 rounded-lg border border-[#B3B3B3]/10 dark:border-gray-800/50 flex flex-col gap-1.5 hover:bg-white dark:hover:bg-[#202020]/75 transition-colors">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-gray-800 dark:text-white leading-tight">
                              {item.program.program_name}
                            </p>
                            <p className="truncate text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                              {item.program.institution.name}
                            </p>
                          </div>
                          
                          {/* Countdown badge */}
                          <span className={`shrink-0 px-1.5 py-0.5 text-[9px] rounded-md uppercase tracking-wide font-bold ${badgeClass}`}>
                            {label}
                          </span>
                        </div>
                        
                        <div className="text-[9px] text-gray-400 dark:text-gray-500 flex justify-between">
                          <span>Deadline: {deadlineDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>) : (
            <div className="rounded-xl border border-[#B3B3B3]/25 bg-white/40 dark:bg-white/5 p-4 text-center space-y-3 mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed font-sans">
                Sign in to save and sync your chat history with our counselors.
              </p>
              <Link
                href="/login"
                className="inline-block w-full text-center text-xs font-semibold py-2.5 px-3 bg-[#066AC9] text-white rounded-lg hover:bg-[#055AAB] transition-colors cursor-pointer"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Portal Switcher Link / Dashboard / Student Card */}
        <div className="border-t border-[#B3B3B3]/30 p-4">
          {isLoggedIn ? (
            (userRole === "COUNSELOR" || userRole === "ADMIN") ? (
              <Link href="/dashboard" className="flex w-full items-center gap-3 rounded-xl bg-[#066AC9]/10 px-4 py-3 text-[#066AC9] hover:bg-[#066AC9]/20 text-sm font-semibold transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <rect x="3" y="3" width="7" height="9"></rect>
                  <rect x="14" y="3" width="7" height="5"></rect>
                  <rect x="14" y="12" width="7" height="9"></rect>
                  <rect x="3" y="16" width="7" height="5"></rect>
                </svg>
                <span className="truncate">
                  {userRole === "ADMIN" ? "Admin Dashboard" : "Counselor Dashboard"}
                </span>
              </Link>
            ) : (
              <div className="flex w-full items-center gap-3 rounded-xl bg-black/5 dark:bg-white/5 px-4 py-3 text-sm text-[#1F2022] dark:text-gray-300">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#066AC9] text-white font-bold text-xs">
                  {userInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[10px] text-gray-500 uppercase tracking-wider leading-none mb-0.5">Student Account</p>
                  <p className="truncate text-xs font-medium">{userName}</p>
                </div>
              </div>
            )
          ) : (
            <Link href="/login" className="flex w-full items-center gap-3 rounded-xl bg-black/5 px-4 py-3 text-[#1F2022] hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 text-sm font-medium transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              <span>Switch Account / Login</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Hamburger */}
      <button
        id="mobile-sidebar-toggle"
        aria-label="Open sidebar menu"
        aria-expanded={isOpen}
        className="fixed top-3 left-3 z-50 rounded-md p-2 hover:bg-black/5 lg:hidden"
        onClick={() => setIsOpen(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
}
