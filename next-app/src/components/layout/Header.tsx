"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  Shield,
  UserCheck,
  ChevronDown,
  AlertTriangle,
  Plus,
  RefreshCw,
  Sparkles,
  LogOut,
} from "lucide-react";
import { UserRole, UserSession } from "@/lib/types";
import { initialSessions } from "@/lib/hospital-data";

interface HeaderProps {
  currentTab: string;
  session: UserSession;
  onSwitchRole: (role: UserRole) => void;
  onOpenQuickAdmit: () => void;
  criticalAlertCount: number;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  session,
  onSwitchRole,
  onOpenQuickAdmit,
  criticalAlertCount,
  onLogout,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: "Executive Command Center",
      subtitle: "Live hospital operational metrics, patient census, and critical telemetry",
    },
    beds: {
      title: "Inpatient Bed & Ward Matrix",
      subtitle: "Real-time occupancy allocation, isolation tracking, and telemetry monitoring",
    },
    patients: {
      title: "Electronic Health Records (EHR)",
      subtitle: "Comprehensive patient clinical dossiers, vital trends, and prescriptions",
    },
    appointments: {
      title: "Outpatient Schedule & Consultations",
      subtitle: "Collision-preventing physician appointments and clinical room dispatch",
    },
    laboratory: {
      title: "Diagnostic Pathology & Imaging",
      subtitle: "Biochemical analysis, critical biomarker flags, and diagnostic report generation",
    },
    pharmacy: {
      title: "Formulary Pharmacy & Dispensing",
      subtitle: "Pharmaceutical inventory, batch expiration velocity, and safe dispensing",
    },
    billing: {
      title: "Hospital Revenue & Ledger",
      subtitle: "Itemized billing, electronic insurance remittals, and multi-mode payment settlement",
    },
    audit: {
      title: "Compliance & Security Audit Log",
      subtitle: "Immutable HIPAA access ledger with cryptographic timestamps and actor tracking",
    },
  };

  const currentMeta = tabTitles[currentTab] || {
    title: "Clinical Portal",
    subtitle: "Healthcare Administrative Platform",
  };

  const rolesList: { role: UserRole; label: string; desc: string }[] = [
    { role: "admin", label: "Executive Director", desc: "Full administrative & financial access" },
    { role: "doctor", label: "Dr. Marcus Smith (Cardiologist)", desc: "Clinical notes, orders & consultations" },
    { role: "nurse", label: "Elena Rostova, RN (ICU)", desc: "Bed matrix, admissions & patient vitals" },
    { role: "pharmacist", label: "Dr. Tariq (Pharmacist)", desc: "Formulary stock & medication dispensing" },
    { role: "lab_tech", label: "Kavita Chen (Lab Scientist)", desc: "Pathology tests & biomarker reports" },
    { role: "billing", label: "Julian Mercer (Billing)", desc: "Invoices, insurance & receipts" },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-8 py-3.5 flex items-center justify-between shadow-xs">
      {/* Title & Context */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight font-heading flex items-center gap-2">
          {currentMeta.title}
          {criticalAlertCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              {criticalAlertCount} Urgent Alert
            </span>
          )}
        </h1>
        <p className="text-xs text-slate-500 font-medium">{currentMeta.subtitle}</p>
      </div>

      {/* Actions & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Quick Emergency Admit Button */}
        <button
          onClick={onOpenQuickAdmit}
          className="brand-btn-gradient text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Patient Admit</span>
        </button>

        {/* 1-Click Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-violet-600" />
            <span className="max-w-[130px] truncate">{session.title}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setRoleMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Test Workstation
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Instant 1-click RBAC simulation
                  </p>
                </div>
                <div className="py-1 space-y-0.5">
                  {rolesList.map((r) => {
                    const isSelected = session.role === r.role;
                    return (
                      <button
                        key={r.role}
                        onClick={() => {
                          onSwitchRole(r.role);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                          isSelected
                            ? "bg-violet-50 text-violet-800 font-semibold"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{r.label}</div>
                          <div className="text-[10px] text-slate-400">{r.desc}</div>
                        </div>
                        {isSelected && (
                          <UserCheck className="w-4 h-4 text-violet-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {onLogout && (
                  <div className="pt-1.5 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setRoleMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-between font-semibold"
                    >
                      <span>Sign Out / Lock Workstation</span>
                      <LogOut className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Notifications Icon with Critical Pulse */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors relative cursor-pointer border border-slate-200"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </button>

          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="text-xs font-bold text-slate-900">
                    Clinical Priority Feed
                  </span>
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    2 Action Items
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 flex gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-rose-900">
                        Critical Lab Biomarker Alert
                      </div>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        Patient James Montgomery: hs-Troponin I (48.2 ng/L). Telemetry dispatched.
                      </p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 flex gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-amber-900">
                        Formulary Stock Low
                      </div>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Azithromycin 250mg has 12 units remaining. Reorder limit: 30.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Workstation Sign Out Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out / Lock Terminal"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-500 transition-colors relative cursor-pointer border border-slate-200 hover:border-rose-200"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

        {/* Dedicated Auth Links */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
          <Link
            href="/login"
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-2.5 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors shadow-xs"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
};
