from datetime import datetime, date
from decimal import Decimal
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db, login_manager


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(30), nullable=False, default="receptionist")  
    # Roles: admin, doctor, receptionist, nurse, lab_tech, pharmacist, billing
    full_name = db.Column(db.String(120), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    doctor_profile = db.relationship("Doctor", backref="user", uselist=False, cascade="all, delete-orphan")
    staff_profile = db.relationship("Staff", backref="user", uselist=False, cascade="all, delete-orphan")
    audit_logs = db.relationship("AuditLog", backref="user", lazy="dynamic")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def has_role(self, *roles):
        return self.role in roles or self.role == "admin"

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"


class Department(db.Model):
    __tablename__ = "departments"

    id = db.Column(db.Integer, primary_key=True)
    department_name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    doctors = db.relationship("Doctor", backref="department", lazy="dynamic")
    staff_members = db.relationship("Staff", backref="department", lazy="dynamic")

    def __repr__(self):
        return f"<Department {self.department_name}>"


class Doctor(db.Model):
    __tablename__ = "doctors"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True)
    specialization = db.Column(db.String(100), nullable=False)
    qualification = db.Column(db.String(100))
    consultation_fee = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal("50.00"))
    license_no = db.Column(db.String(50), unique=True)
    available_days = db.Column(db.String(100), default="Monday to Friday")
    available_time = db.Column(db.String(100), default="09:00 AM - 05:00 PM")
    room_no = db.Column(db.String(20))

    # Relationships
    appointments = db.relationship("Appointment", backref="doctor", lazy="dynamic")
    medical_records = db.relationship("MedicalRecord", backref="doctor", lazy="dynamic")
    prescriptions = db.relationship("Prescription", backref="doctor", lazy="dynamic")
    admissions = db.relationship("Admission", backref="doctor", lazy="dynamic")
    lab_orders = db.relationship("LabOrder", backref="doctor", lazy="dynamic")

    @property
    def license_number(self):
        return self.license_no

    @license_number.setter
    def license_number(self, value):
        self.license_no = value

    def __init__(self, **kwargs):
        if "license_number" in kwargs and "license_no" not in kwargs:
            kwargs["license_no"] = kwargs.pop("license_number")
        if "phone" in kwargs:
            kwargs.pop("phone", None)
        super().__init__(**kwargs)

    @property
    def name(self):
        return self.user.full_name if self.user else "Dr. Unknown"

    def __repr__(self):
        return f"<Doctor {self.name} - {self.specialization}>"


class Patient(db.Model):
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True)
    patient_no = db.Column(db.String(30), unique=True, nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    address = db.Column(db.String(255))
    blood_group = db.Column(db.String(10))
    emergency_contact = db.Column(db.String(100))
    allergies = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    appointments = db.relationship("Appointment", backref="patient", lazy="dynamic", cascade="all, delete-orphan")
    medical_records = db.relationship("MedicalRecord", backref="patient", lazy="dynamic", cascade="all, delete-orphan")
    prescriptions = db.relationship("Prescription", backref="patient", lazy="dynamic", cascade="all, delete-orphan")
    admissions = db.relationship("Admission", backref="patient", lazy="dynamic", cascade="all, delete-orphan")
    lab_orders = db.relationship("LabOrder", backref="patient", lazy="dynamic", cascade="all, delete-orphan")
    invoices = db.relationship("Invoice", backref="patient", lazy="dynamic", cascade="all, delete-orphan")

    @property
    def age(self):
        if self.date_of_birth:
            today = date.today()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return "N/A"

    def __repr__(self):
        return f"<Patient {self.patient_no} - {self.name}>"


class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False)
    appointment_date = db.Column(db.Date, nullable=False)
    time_slot = db.Column(db.String(30), nullable=False)  # e.g., '10:00 AM'
    status = db.Column(db.String(30), default="Scheduled", nullable=False)  # Scheduled, Completed, Cancelled, In-Progress
    reason = db.Column(db.String(255))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Appointment {self.id} on {self.appointment_date} with Doctor {self.doctor_id}>"


class MedicalRecord(db.Model):
    __tablename__ = "medical_records"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False)
    diagnosis = db.Column(db.String(255), nullable=False)
    symptoms = db.Column(db.Text)
    treatment_notes = db.Column(db.Text)
    # Vital signs
    bp = db.Column(db.String(20))           # Blood Pressure e.g., 120/80
    pulse = db.Column(db.String(20))        # bpm e.g., 72
    temperature = db.Column(db.String(20))  # °F / °C e.g., 98.6
    spo2 = db.Column(db.String(20))         # Oxygen saturation % e.g., 98
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    prescriptions = db.relationship("Prescription", backref="medical_record", lazy="dynamic")

    def __repr__(self):
        return f"<MedicalRecord {self.id} - Patient {self.patient_id}>"


class Prescription(db.Model):
    __tablename__ = "prescriptions"

    id = db.Column(db.Integer, primary_key=True)
    record_id = db.Column(db.Integer, db.ForeignKey("medical_records.id"), nullable=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False)
    notes = db.Column(db.Text)
    status = db.Column(db.String(30), default="Pending")  # Pending, Dispensed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship("PrescriptionItem", backref="prescription", lazy="dynamic", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Prescription {self.id} for Patient {self.patient_id}>"


class PrescriptionItem(db.Model):
    __tablename__ = "prescription_items"

    id = db.Column(db.Integer, primary_key=True)
    prescription_id = db.Column(db.Integer, db.ForeignKey("prescriptions.id"), nullable=False)
    medicine_id = db.Column(db.Integer, db.ForeignKey("medicines.id"), nullable=True)
    medicine_name = db.Column(db.String(120), nullable=False)
    dosage = db.Column(db.String(50), nullable=False)        # e.g., 500mg
    frequency = db.Column(db.String(50), nullable=False)     # e.g., Twice daily after meals
    duration = db.Column(db.String(50), nullable=False)      # e.g., 5 days
    instructions = db.Column(db.String(255))

    medicine = db.relationship("Medicine")


class Ward(db.Model):
    __tablename__ = "wards"

    id = db.Column(db.Integer, primary_key=True)
    ward_name = db.Column(db.String(100), unique=True, nullable=False)
    ward_type = db.Column(db.String(50), nullable=False)  # General, ICU, Emergency, Pediatric, Maternity, Private
    floor = db.Column(db.String(20), default="1st Floor")
    capacity = db.Column(db.Integer, default=10)

    beds = db.relationship("Bed", backref="ward", lazy="dynamic")

    def __repr__(self):
        return f"<Ward {self.ward_name} ({self.ward_type})>"


class Bed(db.Model):
    __tablename__ = "beds"

    id = db.Column(db.Integer, primary_key=True)
    ward_id = db.Column(db.Integer, db.ForeignKey("wards.id"), nullable=False)
    bed_number = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(30), default="Available", nullable=False)  # Available, Occupied, Maintenance
    daily_rate = db.Column(db.Numeric(10, 2), default=Decimal("100.00"), nullable=False)

    admissions = db.relationship("Admission", backref="bed", lazy="dynamic")

    def __repr__(self):
        return f"<Bed {self.bed_number} - {self.status}>"


class Admission(db.Model):
    __tablename__ = "admissions"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    bed_id = db.Column(db.Integer, db.ForeignKey("beds.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False)
    admission_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    discharge_date = db.Column(db.DateTime, nullable=True)
    reason = db.Column(db.String(255))
    status = db.Column(db.String(30), default="Admitted", nullable=False)  # Admitted, Discharged
    discharge_summary = db.Column(db.Text)

    def __repr__(self):
        return f"<Admission {self.id} Patient {self.patient_id} Bed {self.bed_id}>"


class LabOrder(db.Model):
    __tablename__ = "lab_orders"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False)
    test_name = db.Column(db.String(120), nullable=False)
    test_category = db.Column(db.String(80), default="Hematology")  # Hematology, Biochemistry, Radiology, Microbiology, Pathology
    status = db.Column(db.String(30), default="Pending", nullable=False)  # Pending, Processing, Completed, Cancelled
    ordered_at = db.Column(db.DateTime, default=datetime.utcnow)

    result = db.relationship("LabResult", backref="order", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LabOrder {self.id} - {self.test_name}>"


class LabResult(db.Model):
    __tablename__ = "lab_results"

    id = db.Column(db.Integer, primary_key=True)
    lab_order_id = db.Column(db.Integer, db.ForeignKey("lab_orders.id"), nullable=False, unique=True)
    result = db.Column(db.Text, nullable=True)
    result_summary = db.Column(db.Text, nullable=False)
    reference_range = db.Column(db.String(100))
    flag = db.Column(db.String(30), default="Normal")  # Normal, Abnormal, Critical
    technician_notes = db.Column(db.Text)
    reported_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<LabResult for Order {self.lab_order_id}>"


class Medicine(db.Model):
    __tablename__ = "medicines"

    id = db.Column(db.Integer, primary_key=True)
    medicine_name = db.Column(db.String(120), nullable=False)
    generic_name = db.Column(db.String(120))
    category = db.Column(db.String(80), default="Tablet")  # Tablet, Syrup, Injection, Capsule, Ointment
    batch_no = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Integer, default=0, nullable=False)
    reorder_level = db.Column(db.Integer, default=20)
    expiry_date = db.Column(db.Date, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal("10.00"))
    manufacturer = db.Column(db.String(120))

    @property
    def is_low_stock(self):
        return self.quantity <= self.reorder_level

    @property
    def is_expired(self):
        return self.expiry_date < date.today()

    def __repr__(self):
        return f"<Medicine {self.medicine_name} ({self.quantity} in stock)>"


class Invoice(db.Model):
    __tablename__ = "invoices"

    id = db.Column(db.Integer, primary_key=True)
    invoice_no = db.Column(db.String(30), unique=True, nullable=False, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    paid_amount = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    status = db.Column(db.String(30), default="Pending", nullable=False)  # Pending, Paid, Partially Paid, Cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship("InvoiceItem", backref="invoice", lazy="dynamic", cascade="all, delete-orphan")
    payments = db.relationship("Payment", backref="invoice", lazy="dynamic", cascade="all, delete-orphan")

    @property
    def balance_due(self):
        return self.total_amount - self.paid_amount

    def __repr__(self):
        return f"<Invoice {self.invoice_no} Total: {self.total_amount}>"


class InvoiceItem(db.Model):
    __tablename__ = "invoice_items"

    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey("invoices.id"), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    item_type = db.Column(db.String(50), default="Consultation")  # Consultation, Pharmacy, Lab, Ward, Other
    quantity = db.Column(db.Integer, default=1, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    total_price = db.Column(db.Numeric(10, 2), nullable=False)


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey("invoices.id"), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    method = db.Column(db.String(50), default="Cash")  # Cash, Card, UPI, Insurance
    transaction_ref = db.Column(db.String(100))
    paid_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Payment {self.id} Amount: {self.amount}>"


class Staff(db.Model):
    __tablename__ = "staff"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True)
    job_title = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    shift = db.Column(db.String(30), default="Morning")  # Morning, Evening, Night
    salary = db.Column(db.Numeric(10, 2), default=Decimal("3000.00"))
    joining_date = db.Column(db.Date, default=date.today)
    status = db.Column(db.String(30), default="Active")

    @property
    def name(self):
        return self.user.full_name if self.user else "Staff Member"

    def __repr__(self):
        return f"<Staff {self.name} - {self.job_title}>"


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    username = db.Column(db.String(80))
    action = db.Column(db.String(100), nullable=False)       # e.g., 'REGISTER_PATIENT', 'CREATE_INVOICE'
    entity_type = db.Column(db.String(50))                   # e.g., 'Patient', 'Invoice', 'Bed'
    entity_id = db.Column(db.String(50))
    details = db.Column(db.Text)
    ip_address = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<AuditLog {self.action} by {self.username} at {self.created_at}>"


def log_activity(action, entity_type=None, entity_id=None, details=None, user=None, ip=None):
    """Helper to record audit trail activity."""
    try:
        from flask_login import current_user
        from flask import request
        
        u_id = None
        u_name = "System"
        if user:
            u_id = user.id
            u_name = user.username
        elif current_user and current_user.is_authenticated:
            u_id = current_user.id
            u_name = current_user.username
            
        ip_addr = ip
        if not ip_addr:
            try:
                ip_addr = request.remote_addr
            except Exception:
                ip_addr = "127.0.0.1"

        log_entry = AuditLog(
            user_id=u_id,
            username=u_name,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            details=details,
            ip_address=ip_addr
        )
        db.session.add(log_entry)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[Audit Log Error]: {e}")
