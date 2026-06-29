export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen w-full bg-[#EDEDED] dark:bg-[#121212]">
      {/* Staff Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#1A1A1A] border-r border-[#EDEDED] dark:border-gray-800 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-[#EDEDED] dark:border-gray-800">
          <h2 className="font-bold text-[#1F2022] dark:text-white">Staff Dashboard</h2>
          <span className="text-xs text-[#066AC9] font-semibold">Counselor Role</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/dashboard" className="block px-4 py-2 rounded-lg bg-[#066AC9]/10 text-[#066AC9] font-medium">
            Active Escalations
          </a>
          <a href="/" className="block px-4 py-2 rounded-lg text-[#1F2022] dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5">
            Back to Chatbot
          </a>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
