"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Download,
  AlertTriangle,
  Info,
  Clock,
  Search,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { AuditEvent } from "@/lib/types";

interface AuditTabProps {
  auditEvents: AuditEvent[];
}

export const AuditTab: React.FC<AuditTabProps> = ({ auditEvents }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredEvents = auditEvents.filter((ev) => {
    const matchesSev =
      filterSeverity === "all" || ev.severity === filterSeverity;
    const matchesSearch =
      ev.action.toLowerCase().includes(search.toLowerCase()) ||
      ev.user.toLowerCase().includes(search.toLowerCase()) ||
      ev.details.toLowerCase().includes(search.toLowerCase());
    return matchesSev && matchesSearch;
  });

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(auditEvents, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hospital_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, action, or patient..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {["all", "info", "warning", "critical"].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  filterSeverity === sev
                    ? "bg-white text-blue-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Trail (JSON)</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Authorized Actor</th>
              <th className="py-3 px-4">Action Recorded</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Audited Details</th>
              <th className="py-3 px-4 text-right">Acuity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEvents.map((ev) => (
              <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                  {ev.timestamp}
                </td>
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{ev.user}</div>
                  <div className="text-[10px] text-slate-400">{ev.role}</div>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">
                  {ev.action}
                </td>
                <td className="py-3 px-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {ev.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                  {ev.details}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  {ev.severity === "critical" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      CRITICAL
                    </span>
                  ) : ev.severity === "warning" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      WARNING
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      INFO
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
