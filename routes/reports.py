from datetime import datetime, date, timedelta
from flask import Blueprint, render_template, request
from flask_login import login_required
from sqlalchemy import func
from extensions import db
from models import Patient, Appointment, Payment, Bed, Medicine, Ward, Invoice
from utils import role_required

reports_bp = Blueprint("reports", __name__, url_prefix="/reports")

@reports_bp.route("/")
@login_required
@role_required("admin", "billing")
def index():
    # 1. Total Metrics
    total_patients = Patient.query.count()
    total_revenue = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).scalar()
    total_appointments = Appointment.query.count()
    total_medicines = Medicine.query.count()

    # 2. Revenue breakdown by payment method
    payment_methods = db.session.query(
        Payment.method,
        func.sum(Payment.amount)
    ).group_by(Payment.method).all()
    method_data = [{"method": m[0], "amount": float(m[1])} for m in payment_methods]

    # 3. Appointment Status Breakdown
    apt_statuses = db.session.query(
        Appointment.status,
        func.count(Appointment.id)
    ).group_by(Appointment.status).all()
    status_data = [{"status": s[0], "count": s[1]} for s in apt_statuses]

    # 4. Bed Occupancy Analysis by Ward
    wards = Ward.query.all()
    ward_occupancy = []
    for w in wards:
        total_beds = w.beds.count()
        occupied = w.beds.filter_by(status="Occupied").count()
        rate = round((occupied / total_beds * 100), 1) if total_beds > 0 else 0
        ward_occupancy.append({
            "ward": w.ward_name,
            "type": w.ward_type,
            "total": total_beds,
            "occupied": occupied,
            "rate": rate
        })

    # 5. Pharmacy Inventory Summary
    pharmacy_value = db.session.query(
        func.coalesce(func.sum(Medicine.quantity * Medicine.unit_price), 0)
    ).scalar()
    low_stock_items = Medicine.query.filter(Medicine.quantity <= Medicine.reorder_level).all()

    # 6. Patient Gender Distribution
    gender_counts = db.session.query(
        Patient.gender,
        func.count(Patient.id)
    ).group_by(Patient.gender).all()
    gender_data = [{"gender": g[0] or "Unspecified", "count": g[1]} for g in gender_counts]

    return render_template(
        "reports/index.html",
        total_patients=total_patients,
        total_revenue=float(total_revenue),
        total_appointments=total_appointments,
        method_data=method_data,
        status_data=status_data,
        ward_occupancy=ward_occupancy,
        pharmacy_value=float(pharmacy_value),
        low_stock_items=low_stock_items,
        gender_data=gender_data
    )
