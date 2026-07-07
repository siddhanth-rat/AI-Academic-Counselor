"use client";

import Sidebar from "@/components/Sidebar";
import { useChat } from "@/context/ChatContext";

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isSidebarCollapsed } = useChat();

  return (
    <div className="flex h-screen w-full">
      <Sidebar />
      <main className={`flex-1 relative transition-all duration-300 h-full overflow-hidden flex flex-col ${
        isSidebarCollapsed ? "lg:ml-0" : "lg:ml-[260px]"
      }`}>
        {children}
      </main>
    </div>
  );
}
