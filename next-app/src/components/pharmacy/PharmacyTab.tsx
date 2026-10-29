"use client";

import React, { useState } from "react";
import {
  Pill,
  AlertTriangle,
  CheckCircle2,
  Package,
  Calendar,
  Search,
  Plus,
  ArrowDownRight,
  TrendingDown,
} from "lucide-react";
import { Medication } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface PharmacyTabProps {
  medications: Medication[];
  onDispense: (medId: string, count: number) => void;
}

export const PharmacyTab: React.FC<PharmacyTabProps> = ({
  medications,
  onDispense,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    "All",
    "Cardiovascular",
    "Antibiotics",
    "Analgesics",
  ];

  const filteredMeds = medications.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCategory === "All" || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

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
            placeholder="Search drug formulary by name, generic, or code..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-violet-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-white text-violet-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Formulary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMeds.map((med) => {
          const isLow = med.stockQuantity <= med.reorderLevel;

          return (
            <div
              key={med.id}
              className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                isLow ? "border-amber-300 bg-amber-50/20" : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        isLow
                          ? "bg-amber-100 text-amber-800"
                          : "bg-violet-50 text-violet-700"
                      }`}
                    >
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 font-heading">
                        {med.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {med.strength} • {med.dosageForm}
                      </p>
                    </div>
                  </div>

                  {isLow ? (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Stock
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      In Stock
                    </span>
                  )}
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Generic:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[170px]">
                      {med.genericName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Batch / Lot:</span>
                    <span className="font-mono text-slate-700">{med.batchNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Unit Price:</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(med.unitPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expires:</span>
                    <span className="text-slate-700">{med.expiryDate}</span>
                  </div>
                </div>

                {/* Stock Level Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Inventory Level</span>
                    <span className={`font-bold ${isLow ? "text-amber-700" : "text-slate-900"}`}>
                      {med.stockQuantity} Units (Reorder: {med.reorderLevel})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isLow ? "bg-amber-500" : "bg-violet-600"
                      }`}
                      style={{
                        width: `${Math.min(100, (med.stockQuantity / (med.reorderLevel * 3)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Fast Dispense Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  {med.code}
                </span>
                <button
                  disabled={med.stockQuantity <= 0}
                  onClick={() => onDispense(med.id, 1)}
                  className="brand-btn-gradient text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Dispense 1 Unit</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
