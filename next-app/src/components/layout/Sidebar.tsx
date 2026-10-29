"use client";

import React from "react";
import {
  Activity,
  BedDouble,
  Users,
  CalendarDays,
  Microscope,
  Pill,
  ReceiptText,
  ShieldCheck,
  ChevronRight,
  HeartPulse,
  Sparkles,
  LogOut,
} from "lucide-react";
import { UserSession } from "@/lib/types";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  session: UserSession;
  bedOccupancyRate: number;
  criticalLabsCount: number;
  lowStockCount: number;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  session,
  bedOccupancyRate,
  criticalLabsCount,
  lowStockCount,
  onLogout,
}) => {
  const navItems = [
    {
      id: "overview",
      label: "Command Center",
      icon: Activity,
      badge: null,
      section: "Core Systems",
    },
    {
      id: "beds",
      label: "Live Bed Matrix",
      icon: BedDouble,
      badge: `${bedOccupancyRate}%`,
      badgeColor: "bg-teal-500/15 text-teal-700 border-teal-500/30",
      section: "Core Systems",
    },
    {
      id: "patients",
      label: "Patient Dossiers",
      icon: Users,
      badge: "5 Active",
      badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
      section: "Clinical Care",
    },
    {
      id: "appointments",
      label: "Doctor Scheduling",
      icon: CalendarDays,
      badge: null,
      section: "Clinical Care",
    },
    {
      id: "laboratory",
      label: "Diagnostics & Labs",
      icon: Microscope,
      badge: criticalLabsCount > 0 ? `${criticalLabsCount} Critical` : null,
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      section: "Clinical Care",
    },
    {
      id: "pharmacy",
      label: "Formulary Pharmacy",
      icon: Pill,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      section: "Administration",
    },
    {
      id: "billing",
      label: "Itemized Billing",
      icon: ReceiptText,
      badge: null,
      section: "Administration",
    },
    {
      id: "audit",
      label: "Audit & Security Log",
      icon: ShieldCheck,
      badge: "HIPAA",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      section: "Administration",
    },
  ];

  // Group items by section
  const sections = ["Core Systems", "Clinical Care", "Administration"];

  return (
    <aside className="w-72 bg-white text-slate-700 border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-40 select-none shadow-sm">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200 flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
            <HeartPulse className="w-5 h-5" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base text-slate-900 tracking-tight font-heading">
              CarePulse HMS
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Hospital Management</p>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section) => {
          const items = navItems.filter((item) => item.section === section);
          return (
            <div key={section}>
              <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = currentTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-violet-50 text-violet-900 border-l-4 border-violet-600 font-semibold shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? "text-violet-600" : "text-slate-400"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isActive
                              ? "bg-violet-100 text-violet-800 border-violet-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Operational Status Strip */}
      <div className="px-3 py-2 mx-3 mb-3 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600 font-medium">System Online</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">99.9% Uptime</span>
        </div>
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between p-1.5 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0 shadow-violet-600/25">
              {session.avatarInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {session.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate capitalize font-medium">
                {session.title}
              </div>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out / Lock Terminal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
