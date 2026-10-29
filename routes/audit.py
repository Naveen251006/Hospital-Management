import json
import io
from datetime import datetime, date
from decimal import Decimal
from flask import Blueprint, render_template, request, flash, redirect, url_for, Response
from flask_login import login_required
from extensions import db
from models import (
    AuditLog, User, Department, Doctor, Patient, Appointment,
    MedicalRecord, Prescription, PrescriptionItem, Ward, Bed,
    Admission, LabOrder, LabResult, Medicine, Invoice, InvoiceItem,
    Payment, Staff, log_activity
)
from utils import role_required

audit_bp = Blueprint("audit", __name__, url_prefix="/audit")

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Type {type(obj)} not serializable")

@audit_bp.route("/")
@login_required
@role_required("admin")
def index():
    action_filter = request.args.get("action", "")
    query = AuditLog.query

    if action_filter:
        query = query.filter(AuditLog.action.ilike(f"%{action_filter}%"))

    logs = query.order_by(AuditLog.created_at.desc()).limit(100).all()
    actions = AuditLog.query.with_entities(AuditLog.action).distinct().all()
    unique_actions = [a[0] for a in actions if a[0]]

    # System table counts for backup overview
    backup_summary = {
        "users": User.query.count(),
        "patients": Patient.query.count(),
        "doctors": Doctor.query.count(),
        "appointments": Appointment.query.count(),
        "records": MedicalRecord.query.count(),
        "beds": Bed.query.count(),
        "medicines": Medicine.query.count(),
        "invoices": Invoice.query.count()
    }

    return render_template(
        "audit/index.html",
        logs=logs,
        unique_actions=unique_actions,
        current_action=action_filter,
        backup_summary=backup_summary
    )

@audit_bp.route("/backup/download")
@login_required
@role_required("admin")
def download_backup():
    """Generates and downloads a complete JSON database snapshot of hospital_db."""
    backup_data = {
        "metadata": {
            "system": "CarePulse Hospital Management System",
            "version": "1.0",
            "database": "hospital_db",
            "exported_at": datetime.utcnow().isoformat(),
        },
        "patients": [
            {
                "patient_no": p.patient_no,
                "name": p.name,
                "date_of_birth": p.date_of_birth.isoformat() if p.date_of_birth else None,
                "gender": p.gender,
                "phone": p.phone,
                "email": p.email,
                "address": p.address,
                "blood_group": p.blood_group,
                "emergency_contact": p.emergency_contact,
                "allergies": p.allergies
            }
            for p in Patient.query.all()
        ],
        "departments": [
            {"name": d.department_name, "description": d.description}
            for d in Department.query.all()
        ],
        "medicines": [
            {
                "name": m.medicine_name,
                "generic": m.generic_name,
                "category": m.category,
                "batch": m.batch_no,
                "quantity": m.quantity,
                "reorder_level": m.reorder_level,
                "expiry": m.expiry_date.isoformat() if m.expiry_date else None,
                "unit_price": float(m.unit_price),
                "manufacturer": m.manufacturer
            }
            for m in Medicine.query.all()
        ],
        "wards": [
            {"name": w.ward_name, "type": w.ward_type, "floor": w.floor, "capacity": w.capacity}
            for w in Ward.query.all()
        ],
        "beds": [
            {"ward_name": b.ward.ward_name if b.ward else None, "bed_number": b.bed_number, "status": b.status, "daily_rate": float(b.daily_rate)}
            for b in Bed.query.all()
        ]
    }

    log_activity("DATABASE_BACKUP_EXPORT", "System", 0, "Created and downloaded full database backup archive.")
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    return Response(
        json.dumps(backup_data, indent=2, default=json_serial),
        mimetype="application/json",
        headers={"Content-Disposition": f"attachment;filename=hospital_db_backup_{timestamp}.json"}
    )

@audit_bp.route("/backup/restore", methods=["POST"])
@login_required
@role_required("admin")
def restore_backup():
    """Validates and restores records from a verified backup file."""
    file = request.files.get("backup_file")
    if not file or not file.filename.endswith(".json"):
        flash("Please upload a valid JSON backup archive.", "danger")
        return redirect(url_for("audit.index"))

    try:
        data = json.load(file)
        if "metadata" not in data or "patients" not in data:
            flash("Invalid backup archive format.", "danger")
            return redirect(url_for("audit.index"))

        # Restore / merge patients
        restored_count = 0
        for p_data in data.get("patients", []):
            existing = Patient.query.filter_by(patient_no=p_data.get("patient_no")).first()
            if not existing:
                dob = None
                if p_data.get("date_of_birth"):
                    dob = datetime.strptime(p_data["date_of_birth"], "%Y-%m-%d").date()
                new_p = Patient(
                    patient_no=p_data.get("patient_no"),
                    name=p_data.get("name"),
                    date_of_birth=dob,
                    gender=p_data.get("gender"),
                    phone=p_data.get("phone"),
                    email=p_data.get("email"),
                    address=p_data.get("address"),
                    blood_group=p_data.get("blood_group"),
                    emergency_contact=p_data.get("emergency_contact"),
                    allergies=p_data.get("allergies")
                )
                db.session.add(new_p)
                restored_count += 1

        db.session.commit()
        log_activity("DATABASE_BACKUP_RESTORE", "System", 0, f"Successfully processed backup restore ({restored_count} new patient records merged).")
        flash(f"Database backup processed successfully! {restored_count} new record(s) synced.", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Restore error: {str(e)}", "danger")

    return redirect(url_for("audit.index"))

@audit_bp.route("/export")
@login_required
@role_required("admin")
def export_logs():
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).all()
    export_data = []
    for log in logs:
        export_data.append({
            "id": log.id,
            "timestamp": log.created_at.isoformat(),
            "username": log.username,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "ip_address": log.ip_address
        })

    log_activity("EXPORT_AUDIT_LOGS", "AuditLog", 0, "Exported system audit trail.")
    return Response(
        json.dumps(export_data, indent=2),
        mimetype="application/json",
        headers={"Content-Disposition": f"attachment;filename=hospital_audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"}
    )
