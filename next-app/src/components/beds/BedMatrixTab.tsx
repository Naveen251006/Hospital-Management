"use client";

import React, { useState } from "react";
import {
  BedDouble,
  Activity,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Sparkles,
  Users,
  Search,
  Filter,
  UserPlus,
  ArrowRightLeft,
  LogOut,
} from "lucide-react";
import { Bed, BedStatus, Patient } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BedMatrixTabProps {
  beds: Bed[];
  patients: Patient[];
  onAllocateBed: (bedId: string, patientId: string) => void;
  onDischargeBed: (bedId: string) => void;
  onSetBedStatus: (bedId: string, status: BedStatus) => void;
}

export const BedMatrixTab: React.FC<BedMatrixTabProps> = ({
  beds,
  patients,
  onAllocateBed,
  onDischargeBed,
  onSetBedStatus,
}) => {
  const [selectedWard, setSelectedWard] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [assignPatientId, setAssignPatientId] = useState<string>("");

  const wards = [
    "All",
    "ICU",
    "Cardiac Care (CCU)",
    "Emergency (ER)",
    "General Ward",
    "Pediatric",
  ];

  const filteredBeds = beds.filter((bed) => {
    const matchWard = selectedWard === "All" || bed.ward === selectedWard;
    const matchStatus = statusFilter === "all" || bed.status === statusFilter;
    return matchWard && matchStatus;
  });

  const availableCount = beds.filter((b) => b.status === "available").length;
  const occupiedCount = beds.filter((b) => b.status === "occupied").length;
  const cleaningCount = beds.filter((b) => b.status === "cleaning").length;
  const maintenanceCount = beds.filter((b) => b.status === "maintenance").length;

  return (
    <div className="space-y-6">
      {/* Ward Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter("available")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "available"
              ? "bg-emerald-50 border-emerald-500 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Available
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-heading">
            {availableCount} Beds
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ready for patient intake</p>
        </button>

        <button
          onClick={() => setStatusFilter("occupied")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "occupied"
              ? "bg-rose-50 border-rose-500 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Occupied
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-heading">
            {occupiedCount} Beds
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active inpatient care</p>
        </button>

        <button
          onClick={() => setStatusFilter("cleaning")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "cleaning"
              ? "bg-amber-50 border-amber-500 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Terminal Cleaning
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-heading">
            {cleaningCount} Beds
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sanitization in progress</p>
        </button>

        <button
          onClick={() => setStatusFilter("maintenance")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "maintenance"
              ? "bg-slate-100 border-slate-500 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Maintenance
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-heading">
            {maintenanceCount} Beds
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Equipment check & repairs</p>
        </button>
      </div>

      {/* Ward Filter Tabs Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {wards.map((ward) => (
            <button
              key={ward}
              onClick={() => setSelectedWard(ward)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedWard === ward
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {ward}
            </button>
          ))}
        </div>

        {statusFilter !== "all" && (
          <button
            onClick={() => setStatusFilter("all")}
            className="text-xs font-semibold text-violet-700 hover:text-violet-800 cursor-pointer"
          >
            Clear Filters (Show All)
          </button>
        )}
      </div>

      {/* Bed Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBeds.map((bed) => {
          const isOccupied = bed.status === "occupied";
          const isAvailable = bed.status === "available";
          const isCleaning = bed.status === "cleaning";

          return (
            <div
              key={bed.id}
              onClick={() => setSelectedBed(bed)}
              className={`rounded-2xl p-5 border transition-all cursor-pointer relative overflow-hidden group hover:shadow-md ${
                isOccupied
                  ? "bg-rose-50/30 border-rose-200 hover:border-rose-400"
                  : isAvailable
                  ? "bg-white border-slate-200 hover:border-emerald-400"
                  : isCleaning
                  ? "bg-amber-50/30 border-amber-200 hover:border-amber-400"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              {/* Status color indicator stripe */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  isOccupied
                    ? "bg-rose-500"
                    : isAvailable
                    ? "bg-emerald-500"
                    : isCleaning
                    ? "bg-amber-500"
                    : "bg-slate-400"
                }`}
              />

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 font-heading">
                      {bed.bedNumber}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {bed.ward}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Rate: {formatCurrency(bed.dailyRate)}/day
                  </span>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isOccupied
                      ? "bg-rose-100 text-rose-800"
                      : isAvailable
                      ? "bg-emerald-100 text-emerald-800"
                      : isCleaning
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {bed.status}
                </span>
              </div>

              {/* Patient Assigned or Standby */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                {isOccupied ? (
                  <div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {bed.patientName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      Attending: {bed.doctorName}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Admitted: {bed.admittedDate}
                    </div>
                  </div>
                ) : isCleaning ? (
                  <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold py-1">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Terminal Sterilization In-Progress</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold py-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Clean & Ready for Assignment</span>
                  </div>
                )}
              </div>

              {/* Connected Clinical Equipment Tags */}
              <div className="mt-3 flex flex-wrap gap-1">
                {bed.equipment.map((eq) => (
                  <span
                    key={eq}
                    className="text-[10px] font-medium bg-slate-100/90 text-slate-600 px-2 py-0.5 rounded"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bed Details & Action Modal */}
      {selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    Bed Details: {selectedBed.bedNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedBed.ward} • {formatCurrency(selectedBed.dailyRate)}/day
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBed(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Current Status
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`capitalize font-bold text-sm px-2.5 py-1 rounded-lg ${
                      selectedBed.status === "occupied"
                        ? "bg-rose-100 text-rose-800"
                        : selectedBed.status === "available"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {selectedBed.status}
                  </span>
                  {selectedBed.patientName && (
                    <span className="font-semibold text-slate-800">
                      Assigned to: {selectedBed.patientName}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Switcher Actions */}
              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Change Bed State
                </span>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <button
                    onClick={() => {
                      onSetBedStatus(selectedBed.id, "available");
                      setSelectedBed({ ...selectedBed, status: "available", patientName: undefined });
                    }}
                    className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100 cursor-pointer"
                  >
                    Set Available
                  </button>
                  <button
                    onClick={() => {
                      onSetBedStatus(selectedBed.id, "cleaning");
                      setSelectedBed({ ...selectedBed, status: "cleaning" });
                    }}
                    className="p-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100 cursor-pointer"
                  >
                    Terminal Clean
                  </button>
                  <button
                    onClick={() => {
                      onSetBedStatus(selectedBed.id, "maintenance");
                      setSelectedBed({ ...selectedBed, status: "maintenance" });
                    }}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Maintenance
                  </button>
                </div>
              </div>

              {/* If available: Allocate patient */}
              {selectedBed.status === "available" && (
                <div className="pt-3 border-t border-slate-100">
                  <label className="font-semibold text-slate-700 text-xs block mb-1.5">
                    Admit / Allocate Registered Patient
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={assignPatientId}
                      onChange={(e) => setAssignPatientId(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option value="">Select a waiting patient...</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.patientNo}) - {p.gender}, {p.age}y
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={!assignPatientId}
                      onClick={() => {
                        onAllocateBed(selectedBed.id, assignPatientId);
                        const assignedP = patients.find((p) => p.id === assignPatientId);
                        setSelectedBed({
                          ...selectedBed,
                          status: "occupied",
                          patientName: assignedP?.name,
                          patientId: assignedP?.id,
                        });
                        setAssignPatientId("");
                      }}
                      className="brand-btn-gradient text-white font-semibold px-4 py-2 rounded-xl disabled:opacity-50 cursor-pointer"
                    >
                      Allocate
                    </button>
                  </div>
                </div>
              )}

              {/* If occupied: Discharge option */}
              {selectedBed.status === "occupied" && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-rose-900">
                        Discharge Patient & Generate Summary
                      </div>
                      <p className="text-[11px] text-rose-700">
                        Frees bed and dispatches to terminal housekeeping
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onDischargeBed(selectedBed.id);
                        setSelectedBed({ ...selectedBed, status: "cleaning", patientName: undefined });
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow cursor-pointer"
                    >
                      Discharge
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
