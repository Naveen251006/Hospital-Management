"use client";

import React, { useState } from "react";
import {
  ReceiptText,
  DollarSign,
  CreditCard,
  Printer,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Plus,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Trash2,
  Sparkles,
  Filter,
} from "lucide-react";
import { Invoice, InvoiceItem, Patient } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BillingTabProps {
  invoices: Invoice[];
  patients?: Patient[];
  onSettleInvoice: (invoiceId: string, amount: number) => void;
  onAddRevenue: (newInvoice: Invoice) => void;
}

export const BillingTab: React.FC<BillingTabProps> = ({
  invoices,
  patients = [],
  onSettleInvoice,
  onAddRevenue,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Partial" | "Unpaid">("All");
  const [isAddRevenueOpen, setIsAddRevenueOpen] = useState(false);

  // Form State for Recording Revenue
  const [patientId, setPatientId] = useState(patients[0]?.id || "custom");
  const [customPatientName, setCustomPatientName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Partial" | "Unpaid">("Paid");
  const [paymentMethod, setPaymentMethod] = useState<"Credit Card" | "Insurance Claim" | "Cash" | "Wire">("Credit Card");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [partialAmountPaid, setPartialAmountPaid] = useState<number>(0);

  // Line items state
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: "Comprehensive Clinical Assessment & Consultation",
      category: "Consultation",
      qty: 1,
      unitPrice: 250,
      total: 250,
    },
  ]);

  // Quick Preset Adders
  const presets: { name: string; category: InvoiceItem["category"]; price: number }[] = [
    { name: "Specialist Consultation", category: "Consultation", price: 250 },
    { name: "ICU Telemetry Ward Care (24h)", category: "Room", price: 1450 },
    { name: "General Bed Inpatient Care (24h)", category: "Room", price: 650 },
    { name: "Comprehensive Metabolic & Lipid Panel", category: "Laboratory", price: 280 },
    { name: "Cardiac Biomarkers & Troponin I STAT", category: "Laboratory", price: 320 },
    { name: "Enoxaparin Sodium IV Infusion Pack", category: "Pharmacy", price: 180 },
    { name: "Arterial Line & Cardiac Catheterization", category: "Procedure", price: 2200 },
  ];

  const handleAddItem = (category: InvoiceItem["category"] = "Consultation", desc = "Clinical Service", price = 150) => {
    setItems((prev) => [
      ...prev,
      {
        description: desc,
        category,
        qty: 1,
        unitPrice: price,
        total: price,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const updated = { ...it, [field]: value };
        if (field === "qty" || field === "unitPrice") {
          const qty = field === "qty" ? Number(value) || 0 : updated.qty;
          const unitPrice = field === "unitPrice" ? Number(value) || 0 : updated.unitPrice;
          updated.total = qty * unitPrice;
        }
        return updated;
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculations for current form
  const formSubtotal = items.reduce((acc, it) => acc + (it.total || 0), 0);
  const formGrandTotal = Math.max(0, formSubtotal - (discountAmount || 0));
  const calculatedPaid =
    paymentStatus === "Paid"
      ? formGrandTotal
      : paymentStatus === "Partial"
      ? Math.min(partialAmountPaid, formGrandTotal)
      : 0;
  const calculatedDue = Math.max(0, formGrandTotal - calculatedPaid);

  // Submit Handler for Add Revenue
  const handleSaveRevenue = (e: React.FormEvent) => {
    e.preventDefault();

    let resolvedPatientName = customPatientName.trim();
    if (patientId !== "custom") {
      const found = patients.find((p) => p.id === patientId);
      if (found) resolvedPatientName = found.name;
    }
    if (!resolvedPatientName) {
      resolvedPatientName = "Outpatient Walk-In";
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = `INV-2026-${randomSuffix}`;
    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNo,
      patientId: patientId === "custom" ? `pat-${Date.now()}` : patientId,
      patientName: resolvedPatientName,
      date: new Date().toISOString().split("T")[0],
      items,
      subtotal: formSubtotal,
      tax: 0,
      discount: discountAmount,
      grandTotal: formGrandTotal,
      amountPaid: calculatedPaid,
      balanceDue: calculatedDue,
      status: paymentStatus,
      paymentMethod,
    };

    onAddRevenue(newInv);
    setIsAddRevenueOpen(false);

    // Reset Form
    setItems([
      {
        description: "Specialist Consultation & Assessment",
        category: "Consultation",
        qty: 1,
        unitPrice: 250,
        total: 250,
      },
    ]);
    setDiscountAmount(0);
    setPartialAmountPaid(0);
    setPaymentStatus("Paid");
  };

  // Summary Metrics
  const totalBilled = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalSettled = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balanceDue, 0);
  const settlementRate = totalBilled > 0 ? Math.round((totalSettled / totalBilled) * 100) : 100;

  // Filtered Ledger
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Financial Intelligence Header KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Billed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Gross Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-heading">
              {formatCurrency(totalBilled)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Across {invoices.length} issued clinical bills
          </p>
        </div>

        {/* Metric 2: Settled Cashflow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Revenue Settled
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 tracking-tight font-heading">
              {formatCurrency(totalSettled)}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              {settlementRate}% Collected
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${settlementRate}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Outstanding Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Outstanding Due
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 tracking-tight font-heading">
              {formatCurrency(totalOutstanding)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {invoices.filter((i) => i.balanceDue > 0).length} pending payments
          </p>
        </div>

        {/* Metric 4: Direct Action Record Revenue */}
        <div className="bg-gradient-to-br from-violet-700 via-indigo-600 to-purple-800 p-5 rounded-2xl text-white shadow-lg shadow-violet-600/25 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-200">
                Quick Action
              </span>
              <Sparkles className="w-4 h-4 text-violet-200" />
            </div>
            <h4 className="text-base font-bold mt-2 font-heading">
              Record Clinical Revenue
            </h4>
            <p className="text-xs text-violet-100/90 mt-1">
              Issue new bill, inpatient charge or outpatient receipt
            </p>
          </div>
          <button
            onClick={() => setIsAddRevenueOpen(true)}
            className="mt-4 w-full bg-white text-violet-900 hover:bg-violet-50 font-bold text-xs py-2.5 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Revenue / Bill</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice number or patient name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-violet-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-stretch sm:self-auto justify-center">
            {(["All", "Paid", "Partial", "Unpaid"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-white text-violet-800 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredInvoices.length} of {invoices.length} Records
          </span>
          <button
            onClick={() => setIsAddRevenueOpen(true)}
            className="brand-btn-gradient text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow cursor-pointer hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Revenue</span>
          </button>
        </div>
      </div>

      {/* Invoices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredInvoices.map((inv) => (
          <div
            key={inv.id}
            onClick={() => setSelectedInvoice(inv)}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-violet-500 transition-all cursor-pointer hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {inv.invoiceNo}
                    </span>
                    <span className="text-[11px] text-slate-400">{inv.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 font-heading">
                    {inv.patientName}
                  </h4>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    inv.status === "Paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : inv.status === "Partial"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {inv.status}
                </span>
              </div>

              {/* Items summary */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                {inv.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-white px-1 rounded border border-slate-200">
                        {item.category}
                      </span>
                      <span className="truncate">{item.description}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 shrink-0 ml-2">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial calculations */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-baseline text-xs">
                <span className="text-slate-500">Grand Total:</span>
                <span className="text-lg font-black text-slate-900 font-heading">
                  {formatCurrency(inv.grandTotal)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>
                  Settled:{" "}
                  <strong className="text-emerald-700 font-mono">
                    {formatCurrency(inv.amountPaid)}
                  </strong>
                </span>
                <span
                  className={
                    inv.balanceDue > 0
                      ? "text-rose-600 font-bold"
                      : "text-emerald-600 font-semibold"
                  }
                >
                  Due: {formatCurrency(inv.balanceDue)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">
                Method: {inv.paymentMethod || "Electronic"}
              </span>
              <span className="text-violet-700 font-bold hover:underline flex items-center gap-1">
                <span>View Receipt</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ReceiptText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No revenue records found</h4>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search criteria or click Record Revenue to create a new ledger.
          </p>
        </div>
      )}

      {/* Record Revenue / Add Bill Modal */}
      {isAddRevenueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-600/30">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    Record Clinical Revenue
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create itemized invoice, record collected payments, and update ledger
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRevenueOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRevenue} className="mt-5 space-y-5">
              {/* Patient Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Billed Patient
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white font-medium"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} [{p.patientNo}]
                      </option>
                    ))}
                    <option value="custom">+ New / Custom Outpatient</option>
                  </select>

                  {patientId === "custom" && (
                    <input
                      type="text"
                      required
                      placeholder="Enter patient full name..."
                      value={customPatientName}
                      onChange={(e) => setCustomPatientName(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  )}
                </div>
              </div>

              {/* Quick Preset Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Quick Service Presets
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((pr) => (
                    <button
                      type="button"
                      key={pr.name}
                      onClick={() => handleAddItem(pr.category, pr.name, pr.price)}
                      className="text-[11px] bg-slate-100 hover:bg-violet-50 hover:text-violet-800 border border-slate-200 hover:border-violet-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-slate-700"
                    >
                      + {pr.name} ({formatCurrency(pr.price)})
                    </button>
                  ))}
                </div>
              </div>

              {/* Itemized Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Itemized Clinical Charges ({items.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="text-xs font-bold text-violet-700 hover:text-violet-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-2"
                    >
                      <select
                        value={it.category}
                        onChange={(e) =>
                          handleUpdateItem(idx, "category", e.target.value)
                        }
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 shrink-0 font-medium"
                      >
                        <option value="Consultation">Consultation</option>
                        <option value="Room">Inpatient / Bed</option>
                        <option value="Laboratory">Laboratory</option>
                        <option value="Pharmacy">Pharmacy</option>
                        <option value="Procedure">Procedure</option>
                      </select>

                      <input
                        type="text"
                        required
                        placeholder="Description of service or medication..."
                        value={it.description}
                        onChange={(e) =>
                          handleUpdateItem(idx, "description", e.target.value)
                        }
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-blue-500 w-full"
                      />

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-400">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={it.qty}
                            onChange={(e) =>
                              handleUpdateItem(idx, "qty", e.target.value)
                            }
                            className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 text-center"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.unitPrice}
                            onChange={(e) =>
                              handleUpdateItem(idx, "unitPrice", e.target.value)
                            }
                            className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono text-right"
                          />
                        </div>

                        <div className="w-20 text-right font-mono font-bold text-xs text-slate-900 shrink-0">
                          {formatCurrency(it.total)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Settlement Configuration */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Payment Settlement Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Settlement Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e: any) => setPaymentStatus(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold"
                    >
                      <option value="Paid">Paid in Full (Immediate Revenue)</option>
                      <option value="Partial">Partial Settlement</option>
                      <option value="Unpaid">Unpaid / Bill Issued</option>
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Payment Instrument
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e: any) => setPaymentMethod(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
                    >
                      <option value="Credit Card">Credit Card (POS Terminal)</option>
                      <option value="Insurance Claim">Insurance Claim / TPA</option>
                      <option value="Cash">Cash Deposit</option>
                      <option value="Wire">Wire Transfer / ACH</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80">
                  {/* Courtesy Discount */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Courtesy Discount ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>

                  {/* If Partial */}
                  {paymentStatus === "Partial" && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Amount Paid Now ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={formGrandTotal}
                        step="1"
                        value={partialAmountPaid}
                        onChange={(e) =>
                          setPartialAmountPaid(Number(e.target.value) || 0)
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-emerald-700 font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* Calculation Summary Box */}
                <div className="pt-3 border-t border-slate-200/80 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(formSubtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200 font-heading">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(formGrandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-600">
                    <span>Revenue Settled Today:</span>
                    <span className="font-mono">{formatCurrency(calculatedPaid)}</span>
                  </div>
                  {calculatedDue > 0 && (
                    <div className="flex justify-between text-xs font-bold text-rose-600">
                      <span>Balance Due:</span>
                      <span className="font-mono">{formatCurrency(calculatedDue)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddRevenueOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="brand-btn-gradient text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md cursor-pointer hover:opacity-95 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Record Revenue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  CarePulse Hospital Accounts
                </h3>
                <p className="text-xs text-slate-500">
                  Itemized Hospital Receipt & Settled Ledger
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-violet-800 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200">
                  {selectedInvoice.invoiceNo}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">{selectedInvoice.date}</p>
              </div>
            </div>

            {/* Patient Header */}
            <div className="py-3 border-b border-slate-100 text-xs">
              <span className="text-slate-400">Billed Patient:</span>{" "}
              <span className="font-bold text-slate-900 text-sm ml-1">
                {selectedInvoice.patientName}
              </span>
            </div>

            {/* Itemized Table */}
            <div className="py-4">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase text-slate-400">
                    <th className="pb-2">Clinical Service</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1 rounded">
                            {it.category}
                          </span>
                          <span>{it.description}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-center text-slate-500">{it.qty}</td>
                      <td className="py-2.5 text-right font-mono text-slate-600">
                        {formatCurrency(it.unitPrice)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(it.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 pt-3 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Clinical Courtesy Discount:</span>
                    <span className="font-mono">-{formatCurrency(selectedInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t font-heading">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(selectedInvoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Settled Amount ({selectedInvoice.paymentMethod || "Electronic"}):</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {formatCurrency(selectedInvoice.amountPaid)}
                  </span>
                </div>
                {selectedInvoice.balanceDue > 0 && (
                  <div className="flex justify-between text-xs font-bold text-rose-600">
                    <span>Outstanding Due:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.balanceDue)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Settle button if balance due */}
            {selectedInvoice.balanceDue > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs mb-4">
                <span className="text-amber-900 font-semibold">
                  Settle Remaining {formatCurrency(selectedInvoice.balanceDue)}
                </span>
                <button
                  onClick={() => {
                    onSettleInvoice(selectedInvoice.id, selectedInvoice.balanceDue);
                    setSelectedInvoice({
                      ...selectedInvoice,
                      amountPaid: selectedInvoice.grandTotal,
                      balanceDue: 0,
                      status: "Paid",
                    });
                  }}
                  className="brand-btn-gradient text-white font-bold px-3 py-1.5 rounded-lg shadow cursor-pointer"
                >
                  Mark Fully Settled
                </button>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
