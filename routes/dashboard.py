from datetime import date, datetime
from flask import Blueprint, render_template
from flask_login import login_required, current_user
from sqlalchemy import func
from extensions import db
from models import (
    Patient, Doctor, Appointment, Bed, Admission,
    LabOrder, Medicine, Invoice, Payment, AuditLog, Ward
)

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/")
@dashboard_bp.route("/dashboard")
@login_required
def index():
    today = date.today()

    # Core statistics
    total_patients = Patient.query.count()
    total_doctors = Doctor.query.count()
    
    # Appointments
    today_appointments = Appointment.query.filter_by(appointment_date=today).order_by(Appointment.time_slot.asc()).all()
    today_appointments_count = len(today_appointments)
    pending_appointments_count = Appointment.query.filter(Appointment.status == "Scheduled").count()

    # Beds & Admissions
    total_beds = Bed.query.count()
    available_beds = Bed.query.filter_by(status="Available").count()
    occupied_beds = Bed.query.filter_by(status="Occupied").count()
    maintenance_beds = Bed.query.filter_by(status="Maintenance").count()
    occupancy_rate = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0
    admitted_patients_count = Admission.query.filter_by(status="Admitted").count()

    # Revenue
    total_revenue = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).scalar()
    pending_invoices_count = Invoice.query.filter(Invoice.status.in_(["Pending", "Partially Paid"])).count()
    
    # Laboratory
    pending_lab_orders = LabOrder.query.filter(LabOrder.status.in_(["Pending", "Processing"])).count()

    # Pharmacy Alerts (Low stock or expired)
    low_stock_medicines = Medicine.query.filter(Medicine.quantity <= Medicine.reorder_level).all()
    low_stock_count = len(low_stock_medicines)

    # Ward summary for bed matrix
    wards = Ward.query.all()
    ward_stats = []
    for ward in wards:
        w_beds = Bed.query.filter_by(ward_id=ward.id).all()
        w_avail = sum(1 for b in w_beds if b.status == "Available")
        w_occ = sum(1 for b in w_beds if b.status == "Occupied")
        ward_stats.append({
            "name": ward.ward_name,
            "type": ward.ward_type,
            "total": len(w_beds),
            "available": w_avail,
            "occupied": w_occ
        })

    # Recent Audit Activity
    recent_logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(8).all()

    # Recent Admissions
    recent_admissions = Admission.query.filter_by(status="Admitted").order_by(Admission.admission_date.desc()).limit(5).all()

    # Popular Doctors
    popular_doctors = Doctor.query.limit(4).all()

    return render_template(
        "dashboard.html",
        total_patients=total_patients,
        patient_count=total_patients,
        total_doctors=total_doctors,
        today_appointments=today_appointments,
        today_appointments_count=today_appointments_count,
        pending_appointments_count=pending_appointments_count,
        total_beds=total_beds,
        available_beds=available_beds,
        occupied_beds=occupied_beds,
        maintenance_beds=maintenance_beds,
        occupancy_rate=occupancy_rate,
        admitted_patients_count=admitted_patients_count,
        total_revenue=float(total_revenue),
        pending_invoices_count=pending_invoices_count,
        pending_lab_orders=pending_lab_orders,
        low_stock_medicines=low_stock_medicines,
        low_stock_count=low_stock_count,
        ward_stats=ward_stats,
        recent_logs=recent_logs,
        recent_admissions=recent_admissions,
        popular_doctors=popular_doctors
    )
