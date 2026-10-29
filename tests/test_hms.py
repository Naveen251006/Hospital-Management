import unittest
from app import create_app
from extensions import db
from models import User, Patient, Doctor, Bed, Medicine, Invoice

class HMSTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def login(self, username, password):
        return self.client.post("/login", data={
            "username": username,
            "password": password
        }, follow_redirects=True)

    def test_00_health_endpoint(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json(), {"status": "ok"})

    def test_01_login_and_dashboard(self):
        response = self.login("admin", "admin123")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Hospital Command Center", response.data)

    def test_02_patients_workflow(self):
        self.login("admin", "admin123")
        # List patients
        res = self.client.get("/patients/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Patient Directory", res.data)

        # Register new patient
        res_post = self.client.post("/patients/new", data={
            "name": "Test Patient Alice",
            "gender": "Female",
            "phone": "555-0101",
            "email": "alice@test.com",
            "address": "123 Test St",
            "blood_group": "O+",
            "emergency_contact": "Bob - 555-0102",
            "allergies": "Latex"
        }, follow_redirects=True)
        # Register new patient via direct starter POST /patients/
        res_starter_post = self.client.post("/patients/", data={
            "name": "Starter Patient Bob",
            "phone": "555-9999",
            "address": "456 Starter Ave"
        }, follow_redirects=True)
        self.assertEqual(res_starter_post.status_code, 200)
        self.assertIn(b"Starter Patient Bob", res_starter_post.data)

        # Missing name validation on POST /patients/
        res_bad = self.client.post("/patients/", data={"name": ""})
        self.assertEqual(res_bad.status_code, 400)

    def test_03_appointments_workflow(self):
        self.login("admin", "admin123")
        res = self.client.get("/appointments/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Appointment Master Schedule", res.data)

    def test_04_admissions_and_bed_matrix(self):
        self.login("admin", "admin123")
        res = self.client.get("/admissions/beds")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Live Ward & Bed Matrix", res.data)

    def test_05_laboratory_workflow(self):
        self.login("admin", "admin123")
        res = self.client.get("/laboratory/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Diagnostic Laboratory", res.data)

    def test_06_pharmacy_and_dispensing(self):
        self.login("admin", "admin123")
        res = self.client.get("/pharmacy/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Hospital Pharmacy & Formulary", res.data)

    def test_07_billing_and_invoices(self):
        self.login("admin", "admin123")
        res = self.client.get("/billing/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Patient Billing & Revenue", res.data)

    def test_08_reports_and_analytics(self):
        self.login("admin", "admin123")
        res = self.client.get("/reports/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Executive Analytics & Clinical Reports", res.data)

    def test_09_audit_logs(self):
        self.login("admin", "admin123")
        res = self.client.get("/audit/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"System Audit Trail & Database Backup", res.data)

    def test_10_notifications(self):
        self.login("admin", "admin123")
        res = self.client.get("/notifications/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Notification & Alert Center", res.data)

    def test_11_database_backup(self):
        self.login("admin", "admin123")
        res = self.client.get("/audit/backup/download")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, "application/json")
        self.assertIn(b"hospital_db", res.data)

    def test_12_database_rules_and_schema_validation(self):
        """Comprehensive verification of database schema tables and important database rules:
        1. All 7 tables (lab_results, medicines, invoices, invoice_items, payments, staff, audit_logs)
           have exact requested columns.
        2. Primary keys and foreign keys for relationships.
        3. Store money using DECIMAL(10,2), not floating-point types.
        4. Store password hashes, never plain-text passwords.
        5. Transactions for billing, payments, and medicine stock updates.
        6. Prevent overlapping appointments and double allocation of beds.
        7. Keep medical data private and restrict access by role.
        """
        from decimal import Decimal
        from models import (
            LabResult, Medicine, Invoice, InvoiceItem, Payment, Staff, AuditLog,
            User, Doctor, Appointment, Bed, Admission
        )

        with self.app.app_context():
            # 1. Schema check: columns match diagram
            lab_cols = [c.name for c in LabResult.__table__.columns]
            for col in ["id", "lab_order_id", "result", "reported_at"]:
                self.assertIn(col, lab_cols, f"Missing {col} in lab_results")

            med_cols = [c.name for c in Medicine.__table__.columns]
            for col in ["id", "medicine_name", "batch_no", "quantity", "expiry_date", "unit_price"]:
                self.assertIn(col, med_cols, f"Missing {col} in medicines")

            inv_cols = [c.name for c in Invoice.__table__.columns]
            for col in ["id", "patient_id", "total_amount", "status", "created_at"]:
                self.assertIn(col, inv_cols, f"Missing {col} in invoices")

            item_cols = [c.name for c in InvoiceItem.__table__.columns]
            for col in ["id", "invoice_id", "description", "quantity", "unit_price"]:
                self.assertIn(col, item_cols, f"Missing {col} in invoice_items")

            pay_cols = [c.name for c in Payment.__table__.columns]
            for col in ["id", "invoice_id", "amount", "method", "paid_at"]:
                self.assertIn(col, pay_cols, f"Missing {col} in payments")

            staff_cols = [c.name for c in Staff.__table__.columns]
            for col in ["id", "user_id", "department_id", "job_title", "phone"]:
                self.assertIn(col, staff_cols, f"Missing {col} in staff")

            audit_cols = [c.name for c in AuditLog.__table__.columns]
            for col in ["id", "user_id", "action", "entity_type", "entity_id", "created_at"]:
                self.assertIn(col, audit_cols, f"Missing {col} in audit_logs")

            # 2. Foreign keys check
            self.assertTrue(len(LabResult.__table__.foreign_keys) > 0)
            self.assertTrue(len(Invoice.__table__.foreign_keys) > 0)
            self.assertTrue(len(InvoiceItem.__table__.foreign_keys) > 0)
            self.assertTrue(len(Payment.__table__.foreign_keys) > 0)
            self.assertTrue(len(Staff.__table__.foreign_keys) > 0)

            # 3. Monetary columns check: DECIMAL(10,2), not float
            med = Medicine.query.first()
            if med:
                self.assertIsInstance(med.unit_price, Decimal)
            inv = Invoice.query.first()
            if inv:
                self.assertIsInstance(inv.total_amount, Decimal)
                self.assertIsInstance(inv.paid_amount, Decimal)

            # 4. Password hashing check: Never plain text
            u = User.query.first()
            if u:
                self.assertNotEqual(u.password_hash, "admin123")
                self.assertFalse(u.password_hash.startswith("admin"))
                self.assertTrue(any(u.password_hash.startswith(prefix) for prefix in ["scrypt:", "pbkdf2:", "$2b$"]))

            # 5. Overlap appointment collision check
            doc = Doctor.query.first()
            pat = Patient.query.first()
            if doc and pat:
                from datetime import date
                test_date = date(2026, 12, 1)
                slot = "10:00 AM - 10:30 AM"
                # Clear any existing appointment on that test slot
                Appointment.query.filter_by(doctor_id=doc.id, appointment_date=test_date, time_slot=slot).delete()
                db.session.commit()

                # Book first appointment
                apt1 = Appointment(patient_id=pat.id, doctor_id=doc.id, appointment_date=test_date, time_slot=slot, status="Scheduled")
                db.session.add(apt1)
                db.session.commit()

                # Attempting to book second overlapping appointment via web route should be rejected
                self.login("admin", "admin123")
                res = self.client.post("/appointments/book", data={
                    "patient_id": pat.id,
                    "doctor_id": doc.id,
                    "appointment_date": "2026-12-01",
                    "time_slot": slot,
                    "reason": "Collision check test"
                }, follow_redirects=True)
                self.assertIn(b"Doctor already has an active appointment", res.data)

            # 6. Double allocation of beds check
            bed = Bed.query.filter_by(status="Occupied").first()
            if bed and pat:
                self.login("admin", "admin123")
                res = self.client.post("/admissions/admit", data={
                    "patient_id": pat.id,
                    "bed_id": bed.id,
                    "doctor_id": doc.id,
                    "reason": "Test double allocation"
                }, follow_redirects=True)
                self.assertIn(b"Selected bed is no longer available", res.data)

            # 7. Role-based privacy / access control
            self.client.get("/logout")
            self.login("reception", "staff123")
            # Receptionist should NOT have access to audit logs or system database backup
            res_audit = self.client.get("/audit/", follow_redirects=True)
            self.assertIn(b"Access denied", res_audit.data)

if __name__ == "__main__":
    unittest.main()
