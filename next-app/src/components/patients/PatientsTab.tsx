"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  HeartPulse,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Pill,
  CheckCircle2,
  Activity,
  Plus,
} from "lucide-react";
import { Patient, Doctor, Medication } from "@/lib/types";

interface PatientsTabProps {
  patients: Patient[];
  doctors: Doctor[];
  medications: Medication[];
  onAddPatient: (patient: Patient) => void;
  onSelectPatient: (patient: Patient) => void;
}

export const PatientsTab: React.FC<PatientsTabProps> = ({
  patients,
  doctors,
  medications,
  onAddPatient,
  onSelectPatient,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeDossier, setActiveDossier] = useState<Patient | null>(null);

  // New Patient Form State
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState<number>(35);
  const [newGender, setNewGender] = useState<"Male" | "Female" | "Other">("Male");
  const [newBlood, setNewBlood] = useState("O+");
  const [newPhone, setNewPhone] = useState("");
  const [newDoctor, setNewDoctor] = useState(doctors[0]?.name || "Dr. Marcus Smith");
  const [newAllergy, setNewAllergy] = useState("");

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);
    const matchesStatus =
      statusFilter === "All" || p.admissionStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newP: Patient = {
      id: `pat-${Date.now()}`,
      patientNo: `PAT-2026-${randomNum}`,
      name: newName,
      age: Number(newAge),
      gender: newGender,
      bloodGroup: newBlood,
      phone: newPhone || "+1 (555) 000-1234",
      email: `${newName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      address: "101 Metro Healthcare Blvd, CA",
      emergencyContact: {
        name: "Primary Kin",
        relationship: "Guardian / Spouse",
        phone: "+1 (555) 000-5678",
      },
      allergies: newAllergy
        ? [{ allergen: newAllergy, severity: "Moderate" }]
        : [],
      vitals: {
        bpSystolic: 120,
        bpDiastolic: 80,
        pulse: 75,
        spo2: 99,
        temp: 98.6,
        lastChecked: "Just now",
      },
      admissionStatus: "Outpatient",
      attendingDoctor: newDoctor,
      registeredDate: new Date().toISOString().split("T")[0],
    };

    onAddPatient(newP);
    setShowAddModal(false);
    setNewName("");
    setNewAllergy("");
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Search, Status Tabs & Add Patient */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient by name, ID (e.g. PAT-2026), phone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-violet-500 focus:bg-white transition-all"
          />
        </div>

        {/* Status Filters & New Patient Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {["All", "Admitted", "Outpatient", "Observation"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === status
                    ? "bg-white text-violet-800 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="brand-btn-gradient text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Patient</span>
          </button>
        </div>
      </div>

      {/* Patient Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => {
          const isElevatedBP = patient.vitals.bpSystolic >= 140;

          return (
            <div
              key={patient.id}
              onClick={() => setActiveDossier(patient)}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-violet-400 transition-all cursor-pointer hover:shadow-md group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-violet-600/30">
                      {patient.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {patient.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-slate-500">
                          {patient.patientNo}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {patient.bloodGroup}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      patient.admissionStatus === "Admitted"
                        ? "bg-rose-100 text-rose-800"
                        : patient.admissionStatus === "Observation"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {patient.admissionStatus}
                  </span>
                </div>

                {/* Vitals Summary Strip */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">BP</span>
                    <span className={`font-bold ${isElevatedBP ? "text-rose-600" : "text-slate-800"}`}>
                      {patient.vitals.bpSystolic}/{patient.vitals.bpDiastolic}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Pulse</span>
                    <span className="font-bold text-slate-800">{patient.vitals.pulse} bpm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">SpO2</span>
                    <span className="font-bold text-emerald-600">{patient.vitals.spo2}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Temp</span>
                    <span className="font-bold text-slate-800">{patient.vitals.temp}°F</span>
                  </div>
                </div>

                {/* Allergies Warning */}
                {patient.allergies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {patient.allergies.map((all) => (
                      <span
                        key={all.allergen}
                        className="text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        {all.allergen} ({all.severity})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Attending doctor & bed */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate max-w-[160px]">
                  Dr: {patient.attendingDoctor.split(",")[0]}
                </span>
                {patient.assignedBed && (
                  <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    Bed: {patient.assignedBed}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 360° EHR Patient Dossier Modal */}
      {activeDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-violet-600/30">
                  {activeDossier.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 font-heading">
                      {activeDossier.name}
                    </h3>
                    <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                      {activeDossier.patientNo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeDossier.gender} • {activeDossier.age} Years Old • Blood Group:{" "}
                    <span className="font-bold text-rose-600">{activeDossier.bloodGroup}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveDossier(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Dossier Body */}
            <div className="py-4 space-y-5 text-xs">
              {/* Vitals Assessment */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Clinical Vitals Assessment
                </span>
                <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Blood Pressure
                    </span>
                    <span className="text-base font-black text-slate-900 mt-0.5 block">
                      {activeDossier.vitals.bpSystolic}/{activeDossier.vitals.bpDiastolic}
                    </span>
                    <span className="text-[10px] text-slate-400">mmHg</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Pulse Rate
                    </span>
                    <span className="text-base font-black text-slate-900 mt-0.5 block">
                      {activeDossier.vitals.pulse}
                    </span>
                    <span className="text-[10px] text-slate-400">bpm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Oxygen Sat (SpO2)
                    </span>
                    <span className="text-base font-black text-emerald-600 mt-0.5 block">
                      {activeDossier.vitals.spo2}%
                    </span>
                    <span className="text-[10px] text-slate-400">Room Air</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Body Temperature
                    </span>
                    <span className="text-base font-black text-slate-900 mt-0.5 block">
                      {activeDossier.vitals.temp}°F
                    </span>
                    <span className="text-[10px] text-slate-400">Tympanic</span>
                  </div>
                </div>
              </div>

              {/* Contact & Emergency Kin */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Contact & Address
                  </span>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeDossier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{activeDossier.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{activeDossier.address}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Emergency Next of Kin
                  </span>
                  <div className="space-y-1 text-slate-700">
                    <div className="font-bold text-slate-900">
                      {activeDossier.emergencyContact.name}
                    </div>
                    <div className="text-slate-500">
                      Relationship: {activeDossier.emergencyContact.relationship}
                    </div>
                    <div className="text-blue-600 font-semibold">
                      {activeDossier.emergencyContact.phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Allergies & Drug Warnings */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Known Drug & Environmental Allergies
                </span>
                {activeDossier.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activeDossier.allergies.map((all) => (
                      <div
                        key={all.allergen}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>
                          {all.allergen} — {all.severity} Alert
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>No known active drug allergies documented (NKA).</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveDossier(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Register New Inpatient / Outpatient
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="py-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Blood Group</label>
                  <select
                    value={newBlood}
                    onChange={(e) => setNewBlood(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Attending Physician
                  </label>
                  <select
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Known Drug Allergy (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa, Aspirin"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="brand-btn-gradient text-white font-bold px-5 py-2 rounded-xl cursor-pointer"
                >
                  Generate Dossier & Admit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
