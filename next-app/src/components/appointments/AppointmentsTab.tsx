"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Clock,
  User,
  Stethoscope,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Appointment, Doctor, Patient } from "@/lib/types";

interface AppointmentsTabProps {
  appointments: Appointment[];
  doctors: Doctor[];
  patients: Patient[];
  onBookAppointment: (apt: Appointment) => void;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  appointments,
  doctors,
  patients,
  onBookAppointment,
}) => {
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || "");
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || "");
  const [aptDate, setAptDate] = useState("2026-10-16");
  const [timeSlot, setTimeSlot] = useState("10:00 AM");
  const [reason, setReason] = useState("");
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);

  const timeSlots = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "04:00 PM",
  ];

  const handleSlotSelect = (slot: string) => {
    setTimeSlot(slot);
    // Collision Prevention Check
    const collision = appointments.find(
      (a) =>
        a.doctorId === selectedDoctorId &&
        a.date === aptDate &&
        a.timeSlot === slot &&
        a.status !== "Cancelled"
    );

    if (collision) {
      setCollisionWarning(
        `Slot Collision Alert: ${collision.doctorName} is already booked at ${slot} for patient ${collision.patientName}.`
      );
    } else {
      setCollisionWarning(null);
    }
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (collisionWarning) return;

    const doc = doctors.find((d) => d.id === selectedDoctorId);
    const pat = patients.find((p) => p.id === selectedPatientId);
    if (!doc || !pat) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: pat.id,
      patientName: pat.name,
      doctorId: doc.id,
      doctorName: doc.name,
      department: doc.department,
      date: aptDate,
      timeSlot,
      reason: reason || "Routine Follow-up & Evaluation",
      status: "Scheduled",
      priority: "Routine",
    };

    onBookAppointment(newApt);
    setShowBookModal(false);
    setReason("");
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
        <div>
          <h3 className="font-bold text-base text-slate-900 font-heading">
            Outpatient Clinic Schedule & Consultations
          </h3>
          <p className="text-xs text-slate-500">
            Real-time doctor appointment calendar with collision block protection
          </p>
        </div>
        <button
          onClick={() => setShowBookModal(true)}
          className="brand-btn-gradient text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Book Consultation</span>
        </button>
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-violet-400 transition-all flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center font-bold">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block font-heading">
                      {apt.timeSlot}
                    </span>
                    <span className="text-[10px] text-slate-400">{apt.date}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    apt.status === "In-Progress"
                      ? "bg-violet-100 text-violet-800 animate-pulse"
                      : apt.status === "Completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {apt.status}
                </span>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-400">Patient:</span>{" "}
                  <span className="font-bold text-slate-800">{apt.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-400">Physician:</span>{" "}
                  <span className="font-semibold text-slate-700">
                    {apt.doctorName.split(",")[0]}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Dept:</span>{" "}
                  <span className="font-medium text-slate-600">{apt.department}</span>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-600 line-clamp-2">
                <span className="font-semibold text-slate-700">Reason:</span>{" "}
                {apt.reason}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span
                className={`font-semibold ${
                  apt.priority === "Urgent"
                    ? "text-rose-600"
                    : "text-slate-500"
                }`}
              >
                ● {apt.priority} Priority
              </span>
              <span className="text-blue-600 font-bold hover:underline cursor-pointer">
                Consultation View
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Book Consultation Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Schedule Outpatient Consultation
              </h3>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBook} className="py-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Select Patient
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patientNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Select Physician & Department
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    setCollisionWarning(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialty} ({d.roomNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Appointment Date
                </label>
                <input
                  type="date"
                  value={aptDate}
                  onChange={(e) => {
                    setAptDate(e.target.value);
                    setCollisionWarning(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Time Slots Selection */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Available Consultation Slot
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {timeSlots.map((slot) => {
                    const isSelected = timeSlot === slot;
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => handleSlotSelect(slot)}
                        className={`py-1.5 text-[11px] rounded-lg font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-violet-600 text-white border-violet-600 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Collision Warning Box */}
              {collisionWarning && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold text-[11px]">{collisionWarning}</span>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Clinical Symptoms / Chief Complaint
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Follow-up consultation on abnormal telemetry or medication review..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!collisionWarning}
                  className="brand-btn-gradient text-white font-bold px-5 py-2 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
