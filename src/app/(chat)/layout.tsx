import Sidebar from "@/components/Sidebar";
import { ChatProvider } from "@/context/ChatContext";

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ChatProvider>
      <div className="flex h-screen w-full">
        <Sidebar />
        <main className="flex-1 lg:ml-[260px] relative transition-all duration-300 h-full overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </ChatProvider>
  );
}
