from datetime import datetime, date, timedelta
from decimal import Decimal
from extensions import db
from models import (
    User, Department, Doctor, Patient, Appointment, MedicalRecord,
    Prescription, PrescriptionItem, Ward, Bed, Admission,
    LabOrder, LabResult, Medicine, Invoice, InvoiceItem, Payment, Staff, AuditLog
)

def seed_database():
    """Seeds the database with essential roles, departments, test users, and starter clinical data."""
    print("[Seed] Checking existing data...")
    if User.query.first():
        print("[Seed] Database already contains records. Skipping initial seeding.")
        return

    print("[Seed] Populating initial hospital management system dataset...")

    # 1. System Users
    users_data = [
        {"username": "admin", "email": "admin@hospital.com", "role": "admin", "full_name": "Dr. Arthur Vance (Director)", "password": "admin123"},
        {"username": "dr.smith", "email": "smith@hospital.com", "role": "doctor", "full_name": "Dr. Alexander Smith, MD", "password": "doctor123"},
        {"username": "dr.sarah", "email": "sarah@hospital.com", "role": "doctor", "full_name": "Dr. Sarah Jenkins, MD", "password": "doctor123"},
        {"username": "dr.patel", "email": "patel@hospital.com", "role": "doctor", "full_name": "Dr. Rajesh Patel, MS", "password": "doctor123"},
        {"username": "reception", "email": "frontdesk@hospital.com", "role": "receptionist", "full_name": "Emma Watson", "password": "staff123"},
        {"username": "nurse", "email": "nurse@hospital.com", "role": "nurse", "full_name": "Rachel Green, RN", "password": "staff123"},
        {"username": "labtech", "email": "lab@hospital.com", "role": "lab_tech", "full_name": "David Miller, MLS", "password": "staff123"},
        {"username": "pharmacist", "email": "pharmacy@hospital.com", "role": "pharmacist", "full_name": "Clara Oswald, PharmD", "password": "staff123"},
        {"username": "billing", "email": "billing@hospital.com", "role": "billing", "full_name": "Marcus Stone", "password": "staff123"},
    ]

    created_users = {}
    for u in users_data:
        user = User(
            username=u["username"],
            email=u["email"],
            role=u["role"],
            full_name=u["full_name"],
            is_active=True
        )
        user.set_password(u["password"])
        db.session.add(user)
        created_users[u["username"]] = user

    db.session.flush()

    # 2. Departments
    dept_cardio = Department(department_name="Cardiology", description="Heart and cardiovascular care")
    dept_peds = Department(department_name="Pediatrics", description="Child and adolescent medical services")
    dept_gen = Department(department_name="General Medicine", description="Primary adult healthcare and internal medicine")
    dept_ortho = Department(department_name="Orthopedics", description="Bone, joint, and musculoskeletal surgery")
    dept_er = Department(department_name="Emergency", description="24/7 Acute critical response and trauma care")

    db.session.add_all([dept_cardio, dept_peds, dept_gen, dept_ortho, dept_er])
    db.session.flush()

    # 3. Doctors
    doc1 = Doctor(
        user_id=created_users["dr.smith"].id,
        department_id=dept_cardio.id,
        specialization="Cardiologist",
        qualification="MD - Cardiology, FACC",
        consultation_fee=Decimal("120.00"),
        license_no="MED-NY-84920",
        available_days="Mon, Tue, Wed, Thu, Fri",
        available_time="09:00 AM - 04:00 PM",
        room_no="Suite 302"
    )
    doc2 = Doctor(
        user_id=created_users["dr.sarah"].id,
        department_id=dept_peds.id,
        specialization="Pediatrician",
        qualification="MD - Pediatrics, FAAP",
        consultation_fee=Decimal("95.00"),
        license_no="MED-NY-77412",
        available_days="Mon, Wed, Fri",
        available_time="10:00 AM - 05:00 PM",
        room_no="Suite 104"
    )
    doc3 = Doctor(
        user_id=created_users["dr.patel"].id,
        department_id=dept_gen.id,
        specialization="Internal Medicine",
        qualification="MD - General Medicine",
        consultation_fee=Decimal("80.00"),
        license_no="MED-NY-61298",
        available_days="Mon to Sat",
        available_time="08:30 AM - 03:30 PM",
        room_no="Suite 201"
    )
    db.session.add_all([doc1, doc2, doc3])

    # 4. Staff members
    staff_nurse = Staff(user_id=created_users["nurse"].id, department_id=dept_er.id, job_title="Head Charge Nurse", phone="+1 555-0192", shift="Morning")
    staff_rec = Staff(user_id=created_users["reception"].id, department_id=dept_gen.id, job_title="Chief Reception Officer", phone="+1 555-0188", shift="Morning")
    staff_lab = Staff(user_id=created_users["labtech"].id, department_id=dept_gen.id, job_title="Senior Lab Technologist", phone="+1 555-0144", shift="Morning")
    staff_pharm = Staff(user_id=created_users["pharmacist"].id, department_id=dept_gen.id, job_title="Supervising Pharmacist", phone="+1 555-0155", shift="Morning")
    staff_bill = Staff(user_id=created_users["billing"].id, department_id=dept_gen.id, job_title="Financial & Billing Officer", phone="+1 555-0166", shift="Morning")
    db.session.add_all([staff_nurse, staff_rec, staff_lab, staff_pharm, staff_bill])
    db.session.flush()

    # 5. Patients
    p1 = Patient(
        patient_no="PAT-2026-0001",
        name="Eleanor Rigby",
        date_of_birth=date(1985, 4, 12),
        gender="Female",
        phone="+1 555-8921",
        email="eleanor.r@example.com",
        address="742 Evergreen Terrace, Springfield",
        blood_group="A+",
        emergency_contact="John Rigby (Spouse) - +1 555-8922",
        allergies="Penicillin"
    )
    p2 = Patient(
        patient_no="PAT-2026-0002",
        name="James Montgomery",
        date_of_birth=date(1972, 9, 28),
        gender="Male",
        phone="+1 555-4301",
        email="j.montgomery@example.com",
        address="104 Elm Street, Riverdale",
        blood_group="O+",
        emergency_contact="Claire Montgomery (Sister) - +1 555-4309",
        allergies="None"
    )
    p3 = Patient(
        patient_no="PAT-2026-0003",
        name="Sofia Rodriguez",
        date_of_birth=date(1996, 11, 3),
        gender="Female",
        phone="+1 555-7762",
        email="sofia.r@example.com",
        address="55 Maple Court, Metropolis",
        blood_group="B-",
        emergency_contact="Carlos Rodriguez (Father) - +1 555-7761",
        allergies="Sulfa drugs"
    )
    p4 = Patient(
        patient_no="PAT-2026-0004",
        name="Lucas Vance",
        date_of_birth=2018 and date(2018, 6, 15),
        gender="Male",
        phone="+1 555-3211",
        email="vance.family@example.com",
        address="89 Pine View, Gotham",
        blood_group="O-",
        emergency_contact="Laura Vance (Mother) - +1 555-3210",
        allergies="Peanuts"
    )
    db.session.add_all([p1, p2, p3, p4])
    db.session.flush()

    # 6. Wards and Beds
    ward_icu = Ward(ward_name="Intensive Care Unit (ICU)", ward_type="ICU", floor="3rd Floor", capacity=6)
    ward_gen = Ward(ward_name="General Medical Ward A", ward_type="General", floor="2nd Floor", capacity=12)
    ward_er = Ward(ward_name="Emergency Observation", ward_type="Emergency", floor="1st Floor", capacity=8)
    ward_ped = Ward(ward_name="Pediatric Care Ward", ward_type="Pediatric", floor="2nd Floor", capacity=10)
    db.session.add_all([ward_icu, ward_gen, ward_er, ward_ped])
    db.session.flush()

    beds = [
        Bed(ward_id=ward_icu.id, bed_number="ICU-01", status="Occupied", daily_rate=Decimal("450.00")),
        Bed(ward_id=ward_icu.id, bed_number="ICU-02", status="Available", daily_rate=Decimal("450.00")),
        Bed(ward_id=ward_icu.id, bed_number="ICU-03", status="Available", daily_rate=Decimal("450.00")),
        Bed(ward_id=ward_gen.id, bed_number="GEN-101", status="Occupied", daily_rate=Decimal("120.00")),
        Bed(ward_id=ward_gen.id, bed_number="GEN-102", status="Available", daily_rate=Decimal("120.00")),
        Bed(ward_id=ward_gen.id, bed_number="GEN-103", status="Maintenance", daily_rate=Decimal("120.00")),
        Bed(ward_id=ward_gen.id, bed_number="GEN-104", status="Available", daily_rate=Decimal("120.00")),
        Bed(ward_id=ward_er.id, bed_number="ER-01", status="Available", daily_rate=Decimal("200.00")),
        Bed(ward_id=ward_er.id, bed_number="ER-02", status="Occupied", daily_rate=Decimal("200.00")),
        Bed(ward_id=ward_ped.id, bed_number="PED-01", status="Available", daily_rate=Decimal("150.00")),
        Bed(ward_id=ward_ped.id, bed_number="PED-02", status="Available", daily_rate=Decimal("150.00")),
    ]
    db.session.add_all(beds)
    db.session.flush()

    # 7. Admissions
    adm1 = Admission(
        patient_id=p2.id,
        bed_id=beds[0].id,  # ICU-01
        doctor_id=doc1.id,
        admission_date=datetime.utcnow() - timedelta(days=2),
        reason="Acute myocardial infarction observation",
        status="Admitted"
    )
    adm2 = Admission(
        patient_id=p3.id,
        bed_id=beds[3].id,  # GEN-101
        doctor_id=doc3.id,
        admission_date=datetime.utcnow() - timedelta(days=1),
        reason="Severe gastroenteritis and dehydration",
        status="Admitted"
    )
    db.session.add_all([adm1, adm2])

    # 8. Appointments
    today = date.today()
    apt1 = Appointment(
        patient_id=p1.id,
        doctor_id=doc1.id,
        appointment_date=today,
        time_slot="10:00 AM",
        status="Scheduled",
        reason="Routine cardiovascular follow-up & hypertension assessment"
    )
    apt2 = Appointment(
        patient_id=p4.id,
        doctor_id=doc2.id,
        appointment_date=today,
        time_slot="11:30 AM",
        status="Scheduled",
        reason="Pediatric annual vaccination and development review"
    )
    apt3 = Appointment(
        patient_id=p2.id,
        doctor_id=doc3.id,
        appointment_date=today + timedelta(days=1),
        time_slot="02:00 PM",
        status="Scheduled",
        reason="Post-admission routine health check"
    )
    apt4 = Appointment(
        patient_id=p3.id,
        doctor_id=doc1.id,
        appointment_date=today - timedelta(days=3),
        time_slot="09:30 AM",
        status="Completed",
        reason="Palpitations and chest discomfort"
    )
    db.session.add_all([apt1, apt2, apt3, apt4])
    db.session.flush()

    # 9. Medical Records & Prescriptions
    rec1 = MedicalRecord(
        patient_id=p3.id,
        doctor_id=doc1.id,
        diagnosis="Benign Sinus Tachycardia due to acute dehydration",
        symptoms="Intermittent palpitations, mild dizziness, dry mouth",
        treatment_notes="Patient reassured. Recommended IV rehydration and electrolyte replenishment. ECG normal sinus rhythm.",
        bp="118/76",
        pulse="88",
        temperature="98.4",
        spo2="99"
    )
    db.session.add(rec1)
    db.session.flush()

    # 10. Pharmacy / Medicines
    meds = [
        Medicine(medicine_name="Amoxicillin 500mg", generic_name="Amoxicillin", category="Capsule", batch_no="AMX-2026-A1", quantity=140, reorder_level=30, expiry_date=date(2027, 8, 15), unit_price=Decimal("12.50"), manufacturer="PharmaCorp"),
        Medicine(medicine_name="Atorvastatin 20mg", generic_name="Atorvastatin Calcium", category="Tablet", batch_no="ATV-2025-C4", quantity=85, reorder_level=20, expiry_date=date(2027, 12, 1), unit_price=Decimal("24.00"), manufacturer="BioLife Labs"),
        Medicine(medicine_name="Metformin 500mg", generic_name="Metformin HCl", category="Tablet", batch_no="MET-2026-B2", quantity=200, reorder_level=40, expiry_date=date(2028, 3, 20), unit_price=Decimal("8.00"), manufacturer="Global Health"),
        Medicine(medicine_name="Paracetamol 650mg", generic_name="Acetaminophen", category="Tablet", batch_no="PCM-2026-99", quantity=450, reorder_level=50, expiry_date=date(2028, 1, 10), unit_price=Decimal("3.50"), manufacturer="HealWell"),
        Medicine(medicine_name="Azithromycin 250mg", generic_name="Azithromycin", category="Tablet", batch_no="AZI-2025-F1", quantity=12, reorder_level=25, expiry_date=date(2026, 11, 30), unit_price=Decimal("18.00"), manufacturer="MediCure"), # Low stock demo!
        Medicine(medicine_name="Salbutamol Inhaler 100mcg", generic_name="Albuterol", category="Inhaler", batch_no="SLB-2026-D8", quantity=35, reorder_level=15, expiry_date=date(2027, 5, 25), unit_price=Decimal("32.00"), manufacturer="AeroMed"),
        Medicine(medicine_name="Omeprazole 20mg", generic_name="Omeprazole", category="Capsule", batch_no="OMP-2026-E5", quantity=160, reorder_level=30, expiry_date=date(2027, 9, 14), unit_price=Decimal("11.00"), manufacturer="DigestCare"),
    ]
    db.session.add_all(meds)
    db.session.flush()

    # 11. Prescriptions
    rx1 = Prescription(
        record_id=rec1.id,
        patient_id=p3.id,
        doctor_id=doc1.id,
        notes="Drink at least 2.5L water daily. Complete full course.",
        status="Dispensed"
    )
    db.session.add(rx1)
    db.session.flush()

    rx_item1 = PrescriptionItem(
        prescription_id=rx1.id,
        medicine_id=meds[3].id, # Paracetamol
        medicine_name=meds[3].medicine_name,
        dosage="650mg",
        frequency="Every 8 hours as needed",
        duration="3 days",
        instructions="Take with a glass of water after food"
    )
    rx_item2 = PrescriptionItem(
        prescription_id=rx1.id,
        medicine_id=meds[6].id, # Omeprazole
        medicine_name=meds[6].medicine_name,
        dosage="20mg",
        frequency="Once daily in morning",
        duration="7 days",
        instructions="Take 30 minutes before breakfast"
    )
    db.session.add_all([rx_item1, rx_item2])

    # 12. Laboratory Orders and Results
    lab1 = LabOrder(
        patient_id=p1.id,
        doctor_id=doc1.id,
        test_name="Complete Blood Count (CBC)",
        test_category="Hematology",
        status="Completed",
        ordered_at=datetime.utcnow() - timedelta(days=1)
    )
    lab2 = LabOrder(
        patient_id=p2.id,
        doctor_id=doc1.id,
        test_name="Lipid Profile & Troponin I",
        test_category="Biochemistry",
        status="Completed",
        ordered_at=datetime.utcnow() - timedelta(days=2)
    )
    lab3 = LabOrder(
        patient_id=p3.id,
        doctor_id=doc3.id,
        test_name="Serum Electrolytes Panel",
        test_category="Biochemistry",
        status="Pending",
        ordered_at=datetime.utcnow() - timedelta(hours=4)
    )
    db.session.add_all([lab1, lab2, lab3])
    db.session.flush()

    res1 = LabResult(
        lab_order_id=lab1.id,
        result="WBC: 6.8 x10^3/uL, RBC: 4.5 x10^6/uL, Hemoglobin: 13.8 g/dL, Platelets: 240 x10^3/uL. All markers normal.",
        result_summary="WBC: 6.8 x10^3/uL, RBC: 4.5 x10^6/uL, Hemoglobin: 13.8 g/dL, Platelets: 240 x10^3/uL. All markers normal.",
        reference_range="Hemoglobin: 12.0 - 15.5 g/dL",
        flag="Normal",
        technician_notes="Sample analyzed with automated hemocytometer. Calibration verified.",
        reported_at=datetime.utcnow() - timedelta(hours=18)
    )
    res2 = LabResult(
        lab_order_id=lab2.id,
        result="Total Cholesterol: 242 mg/dL, HDL: 38 mg/dL, LDL: 165 mg/dL, Troponin I: 0.08 ng/mL (Borderline).",
        result_summary="Total Cholesterol: 242 mg/dL, HDL: 38 mg/dL, LDL: 165 mg/dL, Troponin I: 0.08 ng/mL (Borderline).",
        reference_range="Total Cholesterol < 200 mg/dL, Troponin I < 0.04 ng/mL",
        flag="Critical",
        technician_notes="Elevated cardiac markers flagged for urgent cardiology consultation.",
        reported_at=datetime.utcnow() - timedelta(days=1, hours=10)
    )
    db.session.add_all([res1, res2])

    # 13. Invoices and Payments
    inv1 = Invoice(
        invoice_no="INV-2026-0001",
        patient_id=p1.id,
        total_amount=Decimal("170.00"),
        paid_amount=Decimal("170.00"),
        status="Paid",
        created_at=datetime.utcnow() - timedelta(days=1)
    )
    inv2 = Invoice(
        invoice_no="INV-2026-0002",
        patient_id=p2.id,
        total_amount=Decimal("1020.00"),
        paid_amount=Decimal("500.00"),
        status="Partially Paid",
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    inv3 = Invoice(
        invoice_no="INV-2026-0003",
        patient_id=p3.id,
        total_amount=Decimal("215.00"),
        paid_amount=Decimal("0.00"),
        status="Pending",
        created_at=datetime.utcnow() - timedelta(hours=5)
    )
    db.session.add_all([inv1, inv2, inv3])
    db.session.flush()

    items = [
        InvoiceItem(invoice_id=inv1.id, description="Cardiology Consultation - Dr. Alexander Smith", item_type="Consultation", quantity=1, unit_price=Decimal("120.00"), total_price=Decimal("120.00")),
        InvoiceItem(invoice_id=inv1.id, description="Complete Blood Count (CBC) Laboratory Test", item_type="Lab", quantity=1, unit_price=Decimal("50.00"), total_price=Decimal("50.00")),
        
        InvoiceItem(invoice_id=inv2.id, description="ICU Bed Care (2 days @ $450/day)", item_type="Ward", quantity=2, unit_price=Decimal("450.00"), total_price=Decimal("900.00")),
        InvoiceItem(invoice_id=inv2.id, description="Cardiology Specialist Evaluation", item_type="Consultation", quantity=1, unit_price=Decimal("120.00"), total_price=Decimal("120.00")),

        InvoiceItem(invoice_id=inv3.id, description="General Medicine Consultation - Dr. Rajesh Patel", item_type="Consultation", quantity=1, unit_price=Decimal("80.00"), total_price=Decimal("80.00")),
        InvoiceItem(invoice_id=inv3.id, description="General Ward Day Admission (GEN-101)", item_type="Ward", quantity=1, unit_price=Decimal("120.00"), total_price=Decimal("120.00")),
        InvoiceItem(invoice_id=inv3.id, description="Medications: Paracetamol + Omeprazole", item_type="Pharmacy", quantity=1, unit_price=Decimal("15.00"), total_price=Decimal("15.00")),
    ]
    db.session.add_all(items)

    pay1 = Payment(
        invoice_id=inv1.id,
        amount=Decimal("170.00"),
        method="Insurance",
        transaction_ref="INS-BLUE-88349",
        paid_at=datetime.utcnow() - timedelta(days=1)
    )
    pay2 = Payment(
        invoice_id=inv2.id,
        amount=Decimal("500.00"),
        method="Card",
        transaction_ref="TXN-VISA-99412",
        paid_at=datetime.utcnow() - timedelta(days=1, hours=8)
    )
    db.session.add_all([pay1, pay2])

    # 14. Audit Trail Initial Entries
    audit1 = AuditLog(
        user_id=created_users["admin"].id,
        username="admin",
        action="SYSTEM_INITIALIZATION",
        entity_type="System",
        entity_id="0",
        details="Initial hospital system setup and department master configuration completed.",
        ip_address="127.0.0.1"
    )
    audit2 = AuditLog(
        user_id=created_users["reception"].id,
        username="reception",
        action="REGISTER_PATIENT",
        entity_type="Patient",
        entity_id="PAT-2026-0001",
        details="Registered new patient Eleanor Rigby",
        ip_address="127.0.0.1"
    )
    db.session.add_all([audit1, audit2])

    db.session.commit()
    print("[Seed] Seeding completed successfully! Ready for demonstration.")
