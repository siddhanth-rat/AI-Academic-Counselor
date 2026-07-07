"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const baseLinks = [
  { href: "/dashboard", label: "Active Escalations", exact: true },
  { href: "/dashboard/documents", label: "RAG Knowledge Base", exact: false },
  { href: "/", label: "AI Chatbot", exact: true },
];

export default function StaffNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  
  const links = [...baseLinks];
  if (role === "ADMIN") {
    links.splice(2, 0, { href: "/dashboard/performances", label: "Counselor Performances", exact: true });
    links.splice(3, 0, { href: "/dashboard/audit-logs", label: "Compliance Audit Logs", exact: true });
    links.splice(4, 0, { href: "/dashboard/billing", label: "Billing & Analytics", exact: true });
    links.splice(5, 0, { href: "/dashboard/rag-playground", label: "RAG Playground", exact: true });
  }
  const [pendingCount, setPendingCount] = useState(0);
  const prevPendingCountRef = useRef(0);
  const isMutedRef = useRef(false);

  useEffect(() => {
    isMutedRef.current = localStorage.getItem("muteEscalationAlerts") === "true";
    const handleMuteToggle = () => {
      isMutedRef.current = localStorage.getItem("muteEscalationAlerts") === "true";
    };
    window.addEventListener("muteToggle", handleMuteToggle);
    return () => window.removeEventListener("muteToggle", handleMuteToggle);
  }, []);

  const playNotificationSound = () => {
    if (isMutedRef.current) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(1046.50, now, 0.4);       // C6
      playTone(1318.51, now + 0.15, 0.6); // E6
    } catch(e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/v1/counselor/escalations");
        if (res.ok) {
          const data = await res.json();
          const pCount = (data.escalations || []).filter((e: any) => e.status === "PENDING").length;
          setPendingCount(pCount);
          if (pCount > prevPendingCountRef.current) {
            playNotificationSound();
          }
          prevPendingCountRef.current = pCount;
        }
      } catch (e) {
        // ignore
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="flex-1 space-y-2 p-4">
      {links.map((link) => {
        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center justify-between rounded-lg bg-white px-4 py-2 font-medium transition-colors hover:text-[#066AC9] dark:bg-[#1A1A1A] ${
              isActive ? "text-[#066AC9]" : "text-[#1F2022] dark:text-gray-300"
            }`}
          >
            <span>{link.label}</span>
            {link.href === "/dashboard" && pendingCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
