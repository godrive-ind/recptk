"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, UserPlus, Upload, Settings, FileText, BarChart2, Search, BookOpen, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEffect } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ptk", label: "Data PTK", icon: Users },
  { href: "/candidates", label: "Data Kandidat", icon: UserPlus },
  { href: "/laporan", label: "Laporan Bulanan", icon: FileText },
  { href: "/statistik", label: "Statistik Recruiter", icon: BarChart2 },
  { href: "/pencarian", label: "Pencarian Kandidat", icon: Search },
  { href: "/import", label: "Import Excel", icon: Upload },
  { href: "/master", label: "Master Data", icon: Settings },
  { href: "/panduan", label: "Panduan", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen } = useStore();

  // Close sidebar on mobile when navigating
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={cn(
        "bg-white/80 backdrop-blur-xl border-r border-[#E5E5EA] h-screen fixed z-50 flex flex-col pt-6 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] w-64",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-[#007AFF] flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">Rekirutmen</span>
          </div>
          <button 
            className="md:hidden text-slate-400 hover:text-slate-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4 hide-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#007AFF]/10 text-[#007AFF]"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 active:bg-slate-200/60"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-[#007AFF]" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
