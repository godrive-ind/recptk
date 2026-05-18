"use client";

import { useStore } from "@/lib/store";
import { Menu } from "lucide-react";

export function Header({ title }: { title: string }) {
  const { toggleSidebar } = useStore();

  return (
    <header className="flex justify-between items-center mb-6 pb-4 border-b border-[#E5E5EA]">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-semibold shadow-sm text-sm">
          A
        </div>
      </div>
    </header>
  );
}
