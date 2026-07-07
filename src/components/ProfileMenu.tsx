"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

type Profile = {
  email: string;
  name: string;
  role: "STUDENT" | "COUNSELOR" | "ADMIN";
  city: string;
  state: string;
  dateOfBirth: string;
};

export default function ProfileMenu({ showPortalLink = true }: { showPortalLink?: boolean }) {
  const { data: session, update } = useSession();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    email: session?.user?.email || "",
    name: session?.user?.name || "",
    role: ((session?.user as { role?: Profile["role"] } | undefined)?.role || "STUDENT") as Profile["role"],
    city: "",
    state: "",
    dateOfBirth: "",
  });
  const rootRef = useRef<HTMLDivElement>(null);

  const loadProfile = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const response = await fetch("/api/v1/user/profile", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load profile");
      const { profile: data } = await response.json();
      setProfile({
        email: data.email || session.user.email,
        name: data.name || session.user.name || "User",
        role: data.role || (session.user as { role?: Profile["role"] }).role || "STUDENT",
        city: data.city || "",
        state: data.state || "",
        dateOfBirth: data.dateOfBirth || "",
      });
    } catch {
      setError("Unable to load the latest profile");
    }
  }, [session]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const setField = (field: keyof Profile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/v1/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save profile");
      setProfile((current) => ({ ...current, ...data.profile }));
      await update({ name: data.profile.name });
      setEditing(false);
      setSaved(true);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile");
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile.name || session?.user?.name || profile.email.split("@")[0] || "User";
  const roleLabel = profile.role === "STUDENT" ? "Student" : profile.role === "ADMIN" ? "Administrator" : "Counselor";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => { if (!open) void loadProfile(); setOpen((value) => !value); }}
        aria-expanded={open}
        aria-label="Open profile menu"
        className={`group flex items-center gap-3 rounded-full border p-1.5 pr-4 shadow-sm backdrop-blur-xl transition-all duration-300 ease-out 
          ${open 
            ? "border-[#066AC9]/40 bg-white shadow-md dark:border-gray-700 dark:bg-[#1A1A1A]" 
            : "border-gray-200 bg-white/70 hover:border-[#066AC9]/30 hover:bg-white hover:shadow-md hover:ring-2 hover:ring-[#066AC9]/10 dark:border-white/10 dark:bg-black/30 dark:hover:bg-[#1A1A1A]"
          }`}
      >
        <div className="relative">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#066AC9] via-[#0A84FF] to-[#00C6FF] text-sm font-bold text-white shadow-inner group-hover:scale-105 transition-transform duration-300">
            {initial}
          </span>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-[#1A1A1A] animate-pulse"></span>
        </div>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-36 truncate text-[13px] font-bold text-[#1F2022] dark:text-white group-hover:text-[#066AC9] transition-colors">{displayName}</span>
          <span className="block text-[10px] font-medium tracking-wider text-gray-500 dark:text-gray-400">{roleLabel}</span>
        </span>
        <svg className={`hidden h-4 w-4 text-gray-400 transition-transform duration-300 sm:block ${open ? "rotate-180 text-[#066AC9]" : "group-hover:text-gray-600 dark:group-hover:text-gray-300"}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-[70] mt-2 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#1A1A1A]">
          <div className="bg-gradient-to-br from-[#066AC9] to-[#07559b] p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-lg font-bold ring-1 ring-white/30">{initial}</div>
              <div className="min-w-0">
                <p className="truncate font-bold">{displayName}</p>
                <p className="truncate text-xs text-blue-100">{profile.email}</p>
                <span className="mt-1 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{roleLabel}</span>
              </div>
            </div>
          </div>
          {saved && <p className="border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300">Profile updated successfully</p>}
          {(profile.city || profile.state || profile.dateOfBirth) && (
            <div className="border-b border-gray-100 px-4 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              {(profile.city || profile.state) && <p>📍 {[profile.city, profile.state].filter(Boolean).join(", ")}</p>}
              {profile.dateOfBirth && <p className="mt-1">🎂 {new Date(`${profile.dateOfBirth}T00:00:00`).toLocaleDateString()}</p>}
            </div>
          )}
          <div className="p-2 text-sm">
            <button onClick={() => { setEditing(true); setOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5">
              <span>✏️</span><span>Edit profile</span>
            </button>
            {profile.role === "STUDENT" && (
              <Link href="/my-roadmap" onClick={() => setOpen(false)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5">
                <span>🗺️</span><span>My Roadmap</span>
              </Link>
            )}
            {showPortalLink && (profile.role === "COUNSELOR" || profile.role === "ADMIN") && (
              <Link href="/dashboard" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5">
                <span>▦</span><span>{profile.role === "ADMIN" ? "Admin dashboard" : "Counselor dashboard"}</span>
              </Link>
            )}
            {!showPortalLink && (
              <Link href="/" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5">
                <span>🤖</span><span>AI Chatbot</span>
              </Link>
            )}
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
              <span>↪</span><span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={() => setEditing(false)}>
          <form onSubmit={saveProfile} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1A1A1A]">
            <div className="mb-5 flex items-start justify-between">
              <div><h2 className="text-xl font-bold text-[#1F2022] dark:text-white">Edit profile</h2><p className="mt-1 text-xs text-gray-500">Your counselor and AI chats will use this name.</p></div>
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">✕</button>
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Full name<input required value={profile.name} onChange={(e) => setField("name", e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#066AC9] dark:border-gray-700 dark:bg-[#2C2C2C] dark:text-white" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">City<input value={profile.city} onChange={(e) => setField("city", e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#066AC9] dark:border-gray-700 dark:bg-[#2C2C2C] dark:text-white" /></label>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">State<input value={profile.state} onChange={(e) => setField("state", e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#066AC9] dark:border-gray-700 dark:bg-[#2C2C2C] dark:text-white" /></label>
              </div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Date of birth<input type="date" value={profile.dateOfBirth} onChange={(e) => setField("dateOfBirth", e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#066AC9] dark:border-gray-700 dark:bg-[#2C2C2C] dark:text-white" /></label>
              {error && <p className="rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-red-600">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setEditing(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">Cancel</button><button disabled={saving} className="rounded-xl bg-[#066AC9] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#055AAB] disabled:opacity-50">{saving ? "Saving…" : "Save profile"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
