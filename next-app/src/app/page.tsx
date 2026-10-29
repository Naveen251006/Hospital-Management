"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { BedMatrixTab } from "@/components/beds/BedMatrixTab";
import { PatientsTab } from "@/components/patients/PatientsTab";
import { AppointmentsTab } from "@/components/appointments/AppointmentsTab";
import { LabTab } from "@/components/laboratory/LabTab";
import { PharmacyTab } from "@/components/pharmacy/PharmacyTab";
import { BillingTab } from "@/components/billing/BillingTab";
import { AuditTab } from "@/components/audit/AuditTab";
import { LoginPage } from "@/components/auth/LoginPage";

import {
  initialDoctors,
  initialPatients,
  initialBeds,
  initialAppointments,
  initialLabOrders,
  initialMedications,
  initialInvoices,
  initialAuditEvents,
  initialSessions,
} from "@/lib/hospital-data";
import {
  UserRole,
  UserSession,
  Patient,
  Bed,
  Appointment,
  BedStatus,
  Invoice,
} from "@/lib/types";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>("overview");
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");
  const [activeSession, setActiveSession] = useState<UserSession | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
    // User requested front login screen to always appear on entry
    // Check sessionStorage only if previously authenticated during this active session
    try {
      const stored = sessionStorage.getItem("carepulse_active_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role) {
          setActiveSession(parsed);
          setCurrentRole(parsed.role);
          setIsAuthenticated(true);
        }
      }
    } catch {}
  }, []);

  // Clinical Application State
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [beds, setBeds] = useState<Bed[]>(initialBeds);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [labOrders, setLabOrders] = useState(initialLabOrders);
  const [medications, setMedications] = useState(initialMedications);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [auditEvents, setAuditEvents] = useState(initialAuditEvents);

  // Quick Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const session = activeSession || initialSessions[currentRole] || initialSessions.admin;

  const handleLoginSuccess = (userSession: UserSession) => {
    setActiveSession(userSession);
    setCurrentRole(userSession.role);
    setIsAuthenticated(true);
    showToast(`Welcome back, ${userSession.name}! Terminal unlocked.`);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("carepulse_active_user");
      sessionStorage.removeItem("carepulse_active_user");
    } catch {}
    setActiveSession(null);
    setIsAuthenticated(false);
    showToast("Workstation session terminated securely.");
  };

  // Bed allocation handler
  const handleAllocateBed = (bedId: string, patientId: string) => {
    const targetPatient = patients.find((p) => p.id === patientId);
    if (!targetPatient) return;

    setBeds((prev) =>
      prev.map((b) =>
        b.id === bedId
          ? {
              ...b,
              status: "occupied",
              patientId: targetPatient.id,
              patientName: targetPatient.name,
              admittedDate: new Date().toISOString().split("T")[0],
              doctorName: targetPatient.attendingDoctor,
            }
          : b
      )
    );

    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
              ...p,
              admissionStatus: "Admitted",
              assignedBed: beds.find((b) => b.id === bedId)?.bedNumber,
            }
          : p
      )
    );

    // Record audit event
    const newAudit = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      user: session.name,
      role: session.title,
      action: "Bed Allocation Recorded",
      details: `Allocated Bed to patient ${targetPatient.name} [${targetPatient.patientNo}].`,
      category: "Clinical" as const,
      severity: "info" as const,
    };
    setAuditEvents((prev) => [newAudit, ...prev]);

    showToast(`Assigned patient ${targetPatient.name} to bed successfully!`);
  };

  // Bed discharge handler
  const handleDischargeBed = (bedId: string) => {
    const targetBed = beds.find((b) => b.id === bedId);
    if (!targetBed) return;

    setBeds((prev) =>
      prev.map((b) =>
        b.id === bedId
          ? {
              ...b,
              status: "cleaning",
              patientId: undefined,
              patientName: undefined,
              admittedDate: undefined,
            }
          : b
      )
    );

    if (targetBed.patientId) {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === targetBed.patientId
            ? { ...p, admissionStatus: "Outpatient", assignedBed: undefined }
            : p
        )
      );
    }

    const newAudit = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      user: session.name,
      role: session.title,
      action: "Inpatient Discharged",
      details: `Discharged patient from ${targetBed.bedNumber}. Bed marked for terminal housekeeping.`,
      category: "Clinical" as const,
      severity: "info" as const,
    };
    setAuditEvents((prev) => [newAudit, ...prev]);

    showToast(`Patient discharged from ${targetBed.bedNumber}. Unit sent for sanitization.`);
  };

  const handleSetBedStatus = (bedId: string, status: BedStatus) => {
    setBeds((prev) =>
      prev.map((b) => (b.id === bedId ? { ...b, status } : b))
    );
    showToast(`Bed status updated to: ${status.toUpperCase()}`);
  };

  // Fast Dispense Handler
  const handleDispense = (medId: string, count: number) => {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === medId
          ? { ...m, stockQuantity: Math.max(0, m.stockQuantity - count) }
          : m
      )
    );
    showToast(`Dispensed ${count} unit(s). Stock decremented.`);
  };

  // Settle Invoice Handler
  const handleSettleInvoice = (invoiceId: string, amount: number) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              amountPaid: inv.amountPaid + amount,
              balanceDue: Math.max(0, inv.balanceDue - amount),
              status: inv.balanceDue - amount <= 0 ? "Paid" : "Partial",
            }
          : inv
      )
    );
    showToast(`Payment of $${amount.toFixed(2)} recorded successfully.`);
  };

  // Add Revenue / Invoice Handler
  const handleAddRevenue = (newInvoice: Invoice) => {
    setInvoices((prev) => [newInvoice, ...prev]);

    const newAudit = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      user: session.name,
      role: session.title,
      action: "Clinical Revenue Recorded",
      details: `Generated invoice ${newInvoice.invoiceNo} for ${newInvoice.patientName}: Total $${newInvoice.grandTotal.toFixed(2)} (${newInvoice.status}).`,
      category: "Financial" as const,
      severity: "info" as const,
    };
    setAuditEvents((prev) => [newAudit, ...prev]);

    showToast(`Revenue recorded: $${newInvoice.grandTotal.toLocaleString()} [${newInvoice.invoiceNo}]!`);
  };

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === "occupied").length;
  const bedOccupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  const criticalLabsCount = labOrders.filter((l) =>
    l.results.some((r) => r.flag === "CRITICAL")
  ).length;

  const lowStockCount = medications.filter(
    (m) => m.stockQuantity <= m.reorderLevel
  ).length;

  if (!isAuthenticated) {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-3 duration-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        )}
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-3 duration-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Luxury Dark Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        session={session}
        bedOccupancyRate={bedOccupancyRate}
        criticalLabsCount={criticalLabsCount}
        lowStockCount={lowStockCount}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <div className="ml-72 flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          session={session}
          onSwitchRole={(role) => {
            setCurrentRole(role);
            const nextSession = initialSessions[role] || initialSessions.admin;
            setActiveSession(nextSession);
            try {
              localStorage.setItem("carepulse_active_user", JSON.stringify(nextSession));
            } catch {}
            showToast(`Switched workstation role to: ${nextSession.title}`);
          }}
          onOpenQuickAdmit={() => setCurrentTab("patients")}
          criticalAlertCount={criticalLabsCount}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          {currentTab === "overview" && (
            <OverviewTab
              doctors={initialDoctors}
              patients={patients}
              beds={beds}
              labOrders={labOrders}
              invoices={invoices}
              onSelectTab={setCurrentTab}
              onOpenPatientDossier={() => setCurrentTab("patients")}
            />
          )}

          {currentTab === "beds" && (
            <BedMatrixTab
              beds={beds}
              patients={patients}
              onAllocateBed={handleAllocateBed}
              onDischargeBed={handleDischargeBed}
              onSetBedStatus={handleSetBedStatus}
            />
          )}

          {currentTab === "patients" && (
            <PatientsTab
              patients={patients}
              doctors={initialDoctors}
              medications={medications}
              onAddPatient={(newP) => {
                setPatients((prev) => [newP, ...prev]);
                showToast(`New patient registered: ${newP.name} [${newP.patientNo}]`);
              }}
              onSelectPatient={() => {}}
            />
          )}

          {currentTab === "appointments" && (
            <AppointmentsTab
              appointments={appointments}
              doctors={initialDoctors}
              patients={patients}
              onBookAppointment={(newApt) => {
                setAppointments((prev) => [newApt, ...prev]);
                showToast(`Consultation confirmed for ${newApt.patientName} with ${newApt.doctorName}!`);
              }}
            />
          )}

          {currentTab === "laboratory" && (
            <LabTab labOrders={labOrders} />
          )}

          {currentTab === "pharmacy" && (
            <PharmacyTab
              medications={medications}
              onDispense={handleDispense}
            />
          )}

          {currentTab === "billing" && (
            <BillingTab
              invoices={invoices}
              patients={patients}
              onSettleInvoice={handleSettleInvoice}
              onAddRevenue={handleAddRevenue}
            />
          )}

          {currentTab === "audit" && (
            <AuditTab auditEvents={auditEvents} />
          )}
        </main>
      </div>
    </div>
  );
}
