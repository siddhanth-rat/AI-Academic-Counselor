import ProfileMenu from "@/components/ProfileMenu";
import StaffNavigation from "@/components/StaffNavigation";
import { auth } from "@/auth";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const isRoleAdmin = role === "ADMIN";

  return (
    <div className="flex h-screen w-full bg-[#EDEDED] dark:bg-[#121212]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#EDEDED] bg-white dark:border-gray-800 dark:bg-[#1A1A1A] md:flex">
        <div className="border-b border-[#EDEDED] p-4 dark:border-gray-800">
          <h2 className="font-bold text-[#1F2022] dark:text-white">Staff Dashboard</h2>
          <span className="text-xs font-semibold text-[#066AC9]">{isRoleAdmin ? "Admin Portal" : "Counselor Portal"}</span>
        </div>
        <StaffNavigation />
      </aside>
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[64px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 dark:border-gray-800 dark:bg-[#1A1A1A]">
          <div>
            <p className="text-sm font-bold text-[#1F2022] dark:text-white">{isRoleAdmin ? "Admin workspace" : "Counselor workspace"}</p>
            <p className="text-[11px] text-gray-400">Manage student conversations</p>
          </div>
          <ProfileMenu showPortalLink={false} />
        </header>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
