export type UserRole =
  | "admin"
  | "doctor"
  | "nurse"
  | "receptionist"
  | "pharmacist"
  | "lab_tech"
  | "billing";

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  department: string;
  avatarInitials: string;
}

export interface Patient {
  id: string;
  patientNo: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies: Array<{ allergen: string; severity: "Mild" | "Moderate" | "Severe" }>;
  vitals: {
    bpSystolic: number;
    bpDiastolic: number;
    pulse: number;
    spo2: number;
    temp: number;
    lastChecked: string;
  };
  admissionStatus: "Outpatient" | "Admitted" | "Observation";
  assignedBed?: string;
  attendingDoctor: string;
  registeredDate: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  qualification: string;
  licenseNo: string;
  consultationFee: number;
  roomNo: string;
  availableDays: string[];
  avatarInitials: string;
  activePatientsCount: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  timeSlot: string;
  reason: string;
  status: "Scheduled" | "In-Progress" | "Completed" | "Cancelled";
  priority: "Routine" | "Urgent" | "Follow-up";
}

export type BedStatus = "available" | "occupied" | "maintenance" | "cleaning";

export interface Bed {
  id: string;
  bedNumber: string;
  ward: "ICU" | "Cardiac Care (CCU)" | "Emergency (ER)" | "General Ward" | "Pediatric";
  status: BedStatus;
  dailyRate: number;
  patientId?: string;
  patientName?: string;
  admittedDate?: string;
  doctorName?: string;
  equipment: string[];
}

export interface LabOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  orderedDate: string;
  testCategory: "Hematology" | "Biochemistry" | "Cardiology" | "Radiology";
  testName: string;
  status: "Pending" | "In-Analysis" | "Completed";
  results: Array<{
    parameter: string;
    value: string;
    unit: string;
    referenceRange: string;
    flag?: "NORMAL" | "HIGH" | "CRITICAL";
  }>;
  pathologistNotes?: string;
}

export interface Medication {
  id: string;
  code: string;
  name: string;
  genericName: string;
  category: "Antibiotics" | "Cardiovascular" | "Analgesics" | "Respiratory" | "Endocrine";
  dosageForm: string;
  strength: string;
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  expiryDate: string;
  batchNumber: string;
}

export interface InvoiceItem {
  description: string;
  category: "Consultation" | "Room" | "Laboratory" | "Pharmacy" | "Procedure";
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  patientId: string;
  patientName: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  status: "Paid" | "Partial" | "Unpaid";
  paymentMethod?: "Cash" | "Credit Card" | "Insurance Claim" | "Wire";
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
  category: "Clinical" | "Financial" | "Security" | "Formulary";
  severity: "info" | "warning" | "critical";
}
