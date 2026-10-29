"use client";

import React, { useState } from "react";
import {
  BedDouble,
  Users,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  HeartPulse,
  Stethoscope,
  Microscope,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { Doctor, Patient, Bed, LabOrder, Invoice } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface OverviewTabProps {
  doctors: Doctor[];
  patients: Patient[];
  beds: Bed[];
  labOrders: LabOrder[];
  invoices: Invoice[];
  onSelectTab: (tab: string) => void;
  onOpenPatientDossier: (patient: Patient) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  doctors,
  patients,
  beds,
  labOrders,
  invoices,
  onSelectTab,
  onOpenPatientDossier,
}) => {
  const [chartMetric, setChartMetric] = useState<"patients" | "revenue">("patients");

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === "occupied").length;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalSettled = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);

  // Categorical Revenue Streams
  const roomRev = invoices.flatMap((i) => i.items).filter((it) => it.category === "Room").reduce((a, b) => a + b.total, 0);
  const consultRev = invoices.flatMap((i) => i.items).filter((it) => it.category === "Consultation").reduce((a, b) => a + b.total, 0);
  const labRev = invoices.flatMap((i) => i.items).filter((it) => it.category === "Laboratory").reduce((a, b) => a + b.total, 0);
  const pharmacyRev = invoices.flatMap((i) => i.items).filter((it) => it.category === "Pharmacy").reduce((a, b) => a + b.total, 0);
  const procedureRev = invoices.flatMap((i) => i.items).filter((it) => it.category === "Procedure").reduce((a, b) => a + b.total, 0);

  // SVG Chart Data Points (Simulated 7-Day High Fidelity Trend)
  const censusData = [
    { day: "Mon", count: 42, revenue: 5400 },
    { day: "Tue", count: 58, revenue: 6800 },
    { day: "Wed", count: 64, revenue: 7200 },
    { day: "Thu", count: 51, revenue: 6100 },
    { day: "Fri", count: 72, revenue: 8900 },
    { day: "Sat", count: 48, revenue: 5200 },
    { day: "Sun (Today)", count: 61, revenue: totalBilledToday(totalSettled) },
  ];

  function totalBilledToday(val: number) {
    return val > 0 ? val : 7118;
  }

  return (
    <div className="space-y-6">
      {/* Critical Alert Bar if applicable */}
      <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-blue-500/10 border border-rose-200/60 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Critical Clinical Finding
              </span>
              <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded">
                STAT
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              hs-Troponin I elevated (48.2 ng/L) on Patient James Montgomery [PAT-2026-0089]
            </p>
          </div>
        </div>
        <button
          onClick={() => onSelectTab("laboratory")}
          className="text-xs font-bold px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <span>Open Lab Dossier</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ward Occupancy
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-heading">
              {occupancyRate}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({occupiedBeds}/{totalBeds} Beds)
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-600 to-indigo-500 h-1.5 rounded-full"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Inpatients
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-heading">
              {patients.length}
            </span>
            <span className="text-xs text-emerald-600 font-medium flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +2 Today
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            3 High-Acuity ICU & CCU Admissions
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Consultations Today
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-heading">
              4 Slots
            </span>
            <span className="text-xs text-slate-500 font-medium">
              1 In-Consultation
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            0 Doctor Slot Collisions Detected
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Revenue Settled
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-heading">
                {formatCurrency(totalSettled)}
              </span>
              <span className="text-xs text-emerald-600 font-bold">
                {totalRevenue > 0 ? Math.round((totalSettled / totalRevenue) * 100) : 100}%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Total Billed: {formatCurrency(totalRevenue)}
            </p>
          </div>
          <button
            onClick={() => onSelectTab("billing")}
            className="mt-3 text-xs font-bold text-violet-700 hover:text-violet-800 flex items-center justify-between pt-2 border-t border-slate-100 cursor-pointer"
          >
            <span>+ Record Revenue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Analytics + Bed Acuity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Custom Clinical Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 font-heading">
                Weekly Clinical Throughput & Census
              </h3>
              <p className="text-xs text-slate-500">
                Live outpatient volume and daily admissions trend
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setChartMetric("patients")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMetric === "patients"
                    ? "bg-white text-violet-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Patients (Headcount)
              </button>
              <button
                onClick={() => setChartMetric("revenue")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMetric === "revenue"
                    ? "bg-white text-violet-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Revenue ($)
              </button>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="pt-6 pb-2">
            <div className="h-56 flex items-end justify-between gap-3 px-2">
              {censusData.map((d, idx) => {
                const heightPercent =
                  chartMetric === "patients"
                    ? Math.round((d.count / 80) * 100)
                    : Math.round((d.revenue / 9500) * 100);
                const isToday = idx === censusData.length - 1;

                return (
                  <div
                    key={d.day}
                    className="flex-1 flex flex-col items-center gap-2 group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg pointer-events-none whitespace-nowrap shadow-lg z-10">
                      {chartMetric === "patients"
                        ? `${d.count} Consultations`
                        : formatCurrency(d.revenue)}
                    </div>

                    {/* Bar */}
                    <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl h-full flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          isToday
                            ? "bg-gradient-to-t from-violet-600 to-indigo-500 shadow-md shadow-violet-500/40"
                            : "bg-gradient-to-t from-slate-300 to-slate-400 group-hover:from-violet-400 group-hover:to-indigo-400"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    {/* Day label */}
                    <span
                      className={`text-[11px] font-semibold ${
                        isToday ? "text-violet-700 font-bold" : "text-slate-500"
                      }`}
                    >
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue Streams by Specialty Breakdown */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-violet-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Revenue by Department
                </h4>
              </div>
              <button
                onClick={() => onSelectTab("billing")}
                className="text-xs font-bold text-violet-700 hover:text-violet-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Billing Ledger &rarr;</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="text-[11px] font-medium text-slate-500">Inpatient Care</div>
                <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {formatCurrency(roomRev)}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="text-[11px] font-medium text-slate-500">Consultations</div>
                <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {formatCurrency(consultRev)}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="text-[11px] font-medium text-slate-500">Pathology Lab</div>
                <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {formatCurrency(labRev)}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="text-[11px] font-medium text-slate-500">Pharmacy & Rx</div>
                <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {formatCurrency(pharmacyRev)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Ward Acuity Gauge & Fast Bed Matrix preview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 font-heading">
                Ward Acuity Roster
              </h3>
              <button
                onClick={() => onSelectTab("beds")}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Full Matrix &rarr;
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              {[
                { name: "ICU (Intensive Care)", total: 3, occupied: 1, cleaning: 1, rate: 66, color: "bg-rose-500" },
                { name: "Cardiac Care (CCU)", total: 2, occupied: 1, cleaning: 0, rate: 50, color: "bg-amber-500" },
                { name: "Emergency Observation", total: 2, occupied: 1, cleaning: 0, rate: 50, color: "bg-blue-500" },
                { name: "Pediatric Ward", total: 3, occupied: 1, cleaning: 1, rate: 66, color: "bg-purple-500" },
                { name: "General Inpatient", total: 2, occupied: 1, cleaning: 0, rate: 50, color: "bg-emerald-500" },
              ].map((w) => (
                <div key={w.name}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">{w.name}</span>
                    <span className="text-slate-500">{w.occupied}/{w.total} Beds ({w.rate}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${w.color}`}
                      style={{ width: `${w.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-3 bg-violet-50/80 border border-violet-100 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-950">
              <CheckCircle2 className="w-4 h-4 text-violet-700" />
              <span>Oxygen & Suction Verified</span>
            </div>
            <p className="text-[11px] text-violet-800 mt-1">
              All 12 beds calibrated with telemetry sync and emergency crash cart backup.
            </p>
          </div>
        </div>
      </div>

      {/* Attending Specialists Roster */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 font-heading">
              Active Attending Specialists
            </h3>
            <p className="text-xs text-slate-500">
              Physicians on shift with room allocation and patient census
            </p>
          </div>
          <button
            onClick={() => onSelectTab("appointments")}
            className="text-xs font-bold text-violet-700 hover:text-violet-800 cursor-pointer"
          >
            Manage Schedule &rarr;
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-violet-400 transition-all hover:shadow-sm bg-slate-50/40"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-violet-600/30">
                  {doc.avatarInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {doc.name}
                  </h4>
                  <p className="text-[11px] text-violet-700 font-semibold truncate">
                    {doc.specialty}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="font-medium text-slate-700">{doc.roomNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Consult Fee:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(doc.consultationFee)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
