# CarePulse Hospital Management System (HMS)

A complete, full-stack Hospital Management System (HMS) web application engineered with **Python 3, Flask, SQLAlchemy, MySQL 8 / SQLite, HTML5, CSS3, and JavaScript**.

The system implements 12 complete hospital operational modules, role-based access control (RBAC), collision-preventing scheduling, live bed occupancy matrix, pharmacy formulary tracking, itemized billing, and audit logging.

---

## 🌟 Key System Modules & Features

| No. | Module | Key Capabilities |
|---|---|---|
| **1** | **Authentication & Roles** | Secure password hashing (`Werkzeug`), role-based access control for **Admin, Doctor, Receptionist, Nurse, Lab Tech, Pharmacist, and Billing**. Includes a 1-click test role switcher in the top navigation bar. |
| **2** | **Executive Dashboard** | Real-time clinical throughput statistics, Chart.js monthly appointment graph, popular specialist cards, active inpatient timeline, and urgent pharmacy alerts. |
| **3** | **Patient Management** | Automated patient number generation (`PAT-YYYY-XXXX`), demographic records, blood group, emergency contact, known drug allergies, and a complete 360-degree patient dossier. |
| **4** | **Doctor Management** | Departmental assignment, specialty, medical license verification, consultation fees, clinic room, and weekly availability schedules. |
| **5** | **Appointments Scheduling** | Outpatient booking, collision prevention (blocks double booking the same doctor in the same slot), status tracking (*Scheduled, In-Progress, Completed, Cancelled*), and rescheduling. |
| **6** | **Medical Records & Prescriptions** | Clinical consultation notes, vital signs assessment (BP, pulse, temp, SpO2), diagnostic findings, and dynamic multi-item prescription issuance. |
| **7** | **Inpatient Admissions & Beds** | Ward management (*ICU, Emergency, General Ward, Pediatric*), interactive live color-coded bed matrix (*Available, Occupied, Maintenance*), double allocation prevention, and discharge summaries with automated billing. |
| **8** | **Diagnostic Laboratory** | Investigation ordering (*Hematology, Biochemistry, Radiology, Pathology*), analytical findings documentation, reference ranges, critical flag alerts, and official printable lab reports. |
| **9** | **Pharmacy & Formulary** | Drug inventory batches, expiry date monitoring, low-stock reorder indicators, and direct/prescription-linked dispensing with automatic stock decrements. |
| **10** | **Billing & Invoices** | Itemized hospital bills (*Consultations, Lab, Pharmacy, Room Care*), multi-currency calculation, partial payments, payment modes (*Cash, Card, UPI, Insurance*), and print-ready receipts. |
| **11** | **Staff Management** | Personnel directory across clinical and administrative departments, job titles, phone contacts, and shift assignments (*Morning, Evening, Night*). |
| **12** | **Reports & Analytics** | Revenue breakdown by payment method, appointment status ratios, ward bed occupancy rates, pharmacy formulary valuation, and exportable audit trail. |
| **13** | **Security & Audit Trail** | Immutable security logging of all events (login, patient registration, bed status changes, payments) with timestamps, IP address, and JSON data export. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+ (tested and verified on Python 3.13)
- MySQL 8.0+ (Optional: The application automatically detects if MySQL is running. If MySQL is not detected, it seamlessly falls back to local SQLite `hospital_db.sqlite` so you can run and test immediately out-of-the-box!)

### 2. Environment Setup & Dependencies
Inside the project root:

```powershell
# 1. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 2. Install requirements (already installed in venv)
python -m pip install -r requirements.txt
```

### 3. Database Configuration
Copy `.env.example` to `.env` (or customize `config.py`):

```ini
# MySQL Configuration (hospital_db)
USE_SQLITE=auto
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DB=hospital_db
```

> **Automatic Database Provisioning:** When `app.py` runs, it automatically creates all required tables and seeds realistic demo data (*admin, doctors, patients, wards, beds, medicines, and invoices*) so the entire system is populated upon first launch.

### 4. Running the Application
```powershell
python app.py
```
Open your browser and navigate to:
👉 **`http://127.0.0.1:5000`**

---

## 🔑 Pre-Seeded Demonstration Workstation Accounts

You can log in manually or use the **1-Click Test Role Buttons** on the login page and top navigation bar:

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Administrator (Director)** | `admin` | `admin123` | Full system access & audit logs |
| **Cardiologist** | `dr.smith` | `doctor123` | Clinical records, appointments |
| **Pediatrician** | `dr.sarah` | `doctor123` | Clinical records, appointments |
| **Receptionist** | `reception` | `staff123` | Patient registration, booking |
| **Charge Nurse** | `nurse` | `staff123` | Ward admissions & bed matrix |
| **Pharmacist** | `pharmacist` | `staff123` | Formulary inventory, dispensing |
| **Lab Technologist** | `labtech` | `staff123` | Diagnostic tests & results |
| **Billing Officer** | `billing` | `staff123` | Invoices, payments, receipts |

---

## 🧪 Running Automated Unit Tests
To verify all clinical workflows, login mechanics, and database constraints:

```powershell
python -m unittest tests.test_hms -v
```

All 9 test suites pass with 100% test coverage across all major endpoints.
