"use client";

import React, { useState } from "react";
import {
  Microscope,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Search,
  Filter,
  Activity,
  HeartPulse,
} from "lucide-react";
import { LabOrder } from "@/lib/types";

interface LabTabProps {
  labOrders: LabOrder[];
}

export const LabTab: React.FC<LabTabProps> = ({ labOrders }) => {
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const categories = ["All", "Cardiology", "Hematology", "Biochemistry"];

  const filteredOrders = labOrders.filter((order) => {
    return filterCategory === "All" || order.testCategory === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredOrders.length} Diagnostic Orders
        </span>
      </div>

      {/* Lab Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => {
          const hasCritical = order.results.some((r) => r.flag === "CRITICAL");
          const hasHigh = order.results.some((r) => r.flag === "HIGH");

          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`bg-white rounded-2xl border p-5 transition-all cursor-pointer hover:shadow-md flex flex-col justify-between ${
                hasCritical
                  ? "border-rose-300 hover:border-rose-500 bg-rose-50/20"
                  : hasHigh
                  ? "border-amber-200 hover:border-amber-400"
                  : "border-slate-200 hover:border-violet-400"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {order.orderNumber}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1 font-heading">
                      {order.testName}
                    </h4>
                  </div>
                  {hasCritical ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 animate-pulse flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" /> CRITICAL
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {order.status}
                    </span>
                  )}
                </div>

                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <div>
                    <span className="text-slate-400">Patient:</span>{" "}
                    <span className="font-semibold text-slate-800">{order.patientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Physician:</span>{" "}
                    <span className="font-medium">{order.doctorName.split(",")[0]}</span>
                  </div>
                </div>

                {/* Key results preview */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  {order.results.slice(0, 3).map((res) => (
                    <div
                      key={res.parameter}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span className="text-slate-500 truncate max-w-[170px]">
                        {res.parameter}
                      </span>
                      <span
                        className={`font-bold font-mono px-1.5 py-0.5 rounded ${
                          res.flag === "CRITICAL"
                            ? "bg-rose-600 text-white"
                            : res.flag === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "text-slate-800"
                        }`}
                      >
                        {res.value} {res.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{order.orderedDate}</span>
                <span className="text-violet-700 font-bold hover:underline">
                  View Full Report &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Diagnostic Report Modal (Print-Ready) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Report Letterhead */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-violet-600/30">
                  <Microscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-heading">
                    CarePulse Central Clinical Pathology
                  </h3>
                  <p className="text-xs text-slate-500">
                    Accredited Diagnostic Laboratories & Molecular Imaging
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-violet-800 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200">
                  {selectedOrder.orderNumber}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Date: {selectedOrder.orderedDate}</p>
              </div>
            </div>

            {/* Patient & Doctor Specimen Information */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Patient Information
                </span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedOrder.patientName}
                </div>
                <div className="text-slate-500">ID: {selectedOrder.patientId}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Referring Physician
                </span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedOrder.doctorName}
                </div>
                <div className="text-slate-500">{selectedOrder.testCategory} Panel</div>
              </div>
            </div>

            {/* Table of Biomarker Parameters */}
            <div className="py-4">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase text-slate-400">
                    <th className="pb-2">Biomarker / Assay</th>
                    <th className="pb-2 text-right">Finding</th>
                    <th className="pb-2 text-right">Standard Range</th>
                    <th className="pb-2 text-right">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrder.results.map((res) => (
                    <tr key={res.parameter} className="hover:bg-slate-50">
                      <td className="py-2.5 font-medium text-slate-800">{res.parameter}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        {res.value} {res.unit}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-500">
                        {res.referenceRange} {res.unit}
                      </td>
                      <td className="py-2.5 text-right">
                        {res.flag === "CRITICAL" ? (
                          <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded">
                            CRITICAL
                          </span>
                        ) : res.flag === "HIGH" ? (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            HIGH
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            NORMAL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pathologist Diagnostic Interpretation */}
            {selectedOrder.pathologistNotes && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Pathologist Clinical Findings
                </span>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {selectedOrder.pathologistNotes}
                </p>
              </div>
            )}

            {/* Print & Close */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Report</span>
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
