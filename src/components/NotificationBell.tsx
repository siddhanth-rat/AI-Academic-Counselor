"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Notification = {
  id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/v1/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (e: any) {
        if (e.name !== "AbortError" && e.message !== "Failed to fetch") {
          console.error("Notifications fetch error:", e);
        }
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [status]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id?: string) => {
    try {
      await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev =>
        prev.map(n => (id ? (n.id === id ? { ...n, is_read: true } : n) : { ...n, is_read: true }))
      );
    } catch (e) {
      console.error(e);
    }
  };

  if (status !== "authenticated") return null;

  return (
    <div className="relative">
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) markAsRead(); // Mark all as read when opening
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/70 shadow-sm backdrop-blur-md transition-all hover:border-[#066AC9]/30 hover:bg-white dark:border-white/10 dark:bg-black/30 dark:hover:bg-[#1A1A1A]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#1A1A1A] animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#1A1A1A]">
          <div className="border-b border-gray-100 p-4 pb-3 dark:border-gray-800">
            <h3 className="text-sm font-bold text-[#1F2022] dark:text-white">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`flex gap-3 border-b border-gray-50 p-4 dark:border-gray-800/50 ${n.is_read ? 'opacity-70' : 'bg-[#066AC9]/5 dark:bg-[#066AC9]/10'}`}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#066AC9]/10 text-[#066AC9]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm text-[#1F2022] dark:text-gray-200">{n.content}</p>
                    <p className="mt-1 text-[10px] text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
