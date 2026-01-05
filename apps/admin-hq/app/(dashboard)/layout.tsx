"use client";

import { Sidebar } from "@/components/layout/sidebar";
// Header might be missing, let's create a simple placeholder if needed, or assume it exists
// For now, let's build the layout structure
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="hidden border-r bg-white md:block md:w-64">
        <div className="flex h-16 items-center border-b px-6">
          <span className="font-bold text-lg">Admin HQ</span>
        </div>
        <div className="px-3">
          <Sidebar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
            <h1 className="font-semibold">Dashboard</h1>
        </header>
        <main className="flex-1 p-6">
            {children}
        </main>
      </div>
    </div>
  );
}
