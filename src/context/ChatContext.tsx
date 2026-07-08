"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export interface Message {
  role: "user" | "model" | "counselor" | "system";
  content: string;
  isLoading?: boolean;
  senderName?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  status: string;
  messages: Message[];
}

interface ChatContextType {
  sessions: ChatSession[];
  activeSessionId: string;
  activeSession: ChatSession | undefined;
  createNewChat: () => void;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  updateActiveMessages: (updater: (prev: Message[]) => Message[]) => void;
  updateSessionStatus: (sessionId: string, status: string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

  // Load from LocalStorage on mount (for guest initial state)
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Sync sessions based on login state
  useEffect(() => {
    if (!isLoaded) return;

    if (isLoggedIn) {
      const loadDbSessions = async () => {
        try {
          const res = await fetch("/api/v1/chats");
          if (res.ok) {
            const data = await res.json();
            const clientSessions: ChatSession[] = (data.sessions || []).map((s: any) => ({
              id: s.id,
              title: s.title,
              createdAt: s.created_at,
              status: s.status,
              messages: (s.messages || []).map((m: any) => ({
                role: m.sender_type === "USER" ? "user" : m.sender_type === "COUNSELOR" ? "counselor" : m.sender_type === "SYSTEM" ? "system" : "model",
                content: m.content,
                senderName: m.sender_type === "COUNSELOR" ? s.counselor?.name || "Counselor" : undefined,
              }))
            }));
            setSessions(clientSessions);
            if (clientSessions.length > 0) {
              setActiveSessionId(clientSessions[0].id);
            } else {
              // Create default first chat in DB if none exist
              const createRes = await fetch("/api/v1/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "New Chat" })
              });
              if (createRes.ok) {
                const createData = await createRes.json();
                const newSess: ChatSession = {
                  id: createData.session.id,
                  title: createData.session.title,
                  createdAt: createData.session.created_at,
                  status: createData.session.status,
                  messages: []
                };
                setSessions([newSess]);
                setActiveSessionId(newSess.id);
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch sessions from DB", e);
        }
      };
      loadDbSessions();
    } else {
      setSessions([]);
      setActiveSessionId("");
    }
  }, [isLoggedIn, isLoaded]);

  const createNewChat = async () => {
    // Prevent creating multiple empty sessions
    const emptySession = sessions.find((s) => s.messages.length === 0);
    if (emptySession) {
      setActiveSessionId(emptySession.id);
      return;
    }

    if (isLoggedIn) {
      try {
        const res = await fetch("/api/v1/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Chat" })
        });
        if (res.ok) {
          const data = await res.json();
          const newSession: ChatSession = {
            id: data.session.id,
            title: data.session.title,
            createdAt: data.session.created_at,
            status: data.session.status,
            messages: []
          };
          setSessions((prev) => [newSession, ...prev]);
          setActiveSessionId(newSession.id);
        }
      } catch (e) {
        console.error("Failed to create chat in DB", e);
      }
    }
  };

  const selectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const deleteSession = async (id: string) => {
    if (isLoggedIn) {
      try {
        await fetch(`/api/v1/chats/${id}`, { method: "DELETE" });
      } catch (e) {
        console.error("Failed to delete chat in DB", e);
      }
    }

    let isHistoryEmpty = false;
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        isHistoryEmpty = true;
        return [];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });

    if (isHistoryEmpty && isLoggedIn) {
      try {
        const res = await fetch("/api/v1/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Chat" })
        });
        if (res.ok) {
          const data = await res.json();
          const newSession: ChatSession = {
            id: data.session.id,
            title: data.session.title,
            createdAt: data.session.created_at,
            status: data.session.status,
            messages: []
          };
          setSessions([newSession]);
          setActiveSessionId(newSession.id);
        }
      } catch (e) {
        console.error("Failed to create chat in DB", e);
      }
    }
  };

  const updateActiveMessages = (updater: (prev: Message[]) => Message[]) => {
    // Look at current active session before updating
    const currentActiveSession = sessions.find(s => s.id === activeSessionId);
    let shouldGenerateTitle = false;
    let firstUserMsgContent = "";

    if (currentActiveSession && currentActiveSession.title === "New Chat") {
      const currentMessages = currentActiveSession.messages;
      const newMessages = updater(currentMessages);
      const firstUserMsg = newMessages.find((m) => m.role === "user");
      
      // If we just got our first user message, trigger title generation
      if (firstUserMsg && !currentMessages.find(m => m.role === "user")) {
        shouldGenerateTitle = true;
        firstUserMsgContent = firstUserMsg.content;
      }
    }

    setSessions((prevSessions) =>
      prevSessions.map((sess) => {
        if (sess.id === activeSessionId) {
          const newMessages = updater(sess.messages);
          let title = sess.title;
          if (title === "New Chat" && shouldGenerateTitle) {
            title = "Generating title...";
          }
          return { ...sess, messages: newMessages, title };
        }
        return sess;
      })
    );

    if (shouldGenerateTitle && isLoggedIn) {
      fetch(`/api/v1/chats/${activeSessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateTitleFrom: firstUserMsgContent })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.session.title) {
          setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title: data.session.title } : s));
        }
      })
      .catch(e => console.error("Failed to generate title via API", e));
    }
  };

  const updateSessionStatus = (sessionId: string, status: string) => {
    setSessions((prevSessions) =>
      prevSessions.map((s) => (s.id === sessionId ? { ...s, status } : s))
    );
  };

  const renameSession = async (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    
    // Optimistic UI update
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title: trimmed } : s)));
    
    if (isLoggedIn) {
      try {
        await fetch(`/api/v1/chats/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed })
        });
      } catch (e) {
        console.error("Failed to rename session", e);
      }
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <ChatContext.Provider
      value={{
        sessions,
        activeSessionId,
        activeSession,
        createNewChat,
        selectSession,
        deleteSession,
        renameSession,
        updateActiveMessages,
        updateSessionStatus,
        isSidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
}
