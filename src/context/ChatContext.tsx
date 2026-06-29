"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Message {
  role: "user" | "model";
  content: string;
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
}

interface ChatContextType {
  sessions: ChatSession[];
  activeSessionId: string;
  activeSession: ChatSession | undefined;
  createNewChat: () => void;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  updateActiveMessages: (updater: (prev: Message[]) => Message[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = "admission_chatbot_sessions_v1";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          setIsLoaded(true);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load sessions from localStorage", e);
    }

    // Initial default fallback session
    const initialSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: "New Chat",
      createdAt: new Date().toISOString(),
      messages: [],
    };
    setSessions([initialSession]);
    setActiveSessionId(initialSession.id);
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage whenever sessions change
  useEffect(() => {
    if (isLoaded && sessions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.error("Failed to save sessions to localStorage", e);
      }
    }
  }, [sessions, isLoaded]);

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: "New Chat",
      createdAt: new Date().toISOString(),
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const selectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fallback: ChatSession = {
          id: `session_${Date.now()}`,
          title: "New Chat",
          createdAt: new Date().toISOString(),
          messages: [],
        };
        setActiveSessionId(fallback.id);
        return [fallback];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const updateActiveMessages = (updater: (prev: Message[]) => Message[]) => {
    setSessions((prevSessions) =>
      prevSessions.map((sess) => {
        if (sess.id === activeSessionId) {
          const newMessages = updater(sess.messages);
          let title = sess.title;
          if (title === "New Chat" && newMessages.length > 0) {
            const firstUserMsg = newMessages.find((m) => m.role === "user");
            if (firstUserMsg) {
              title = firstUserMsg.content.slice(0, 25) + (firstUserMsg.content.length > 25 ? "..." : "");
            }
          }
          return { ...sess, messages: newMessages, title };
        }
        return sess;
      })
    );
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
        updateActiveMessages,
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
