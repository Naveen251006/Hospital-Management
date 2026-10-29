from datetime import datetime
from decimal import Decimal
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import db
from models import Admission, Bed, Ward, Patient, Doctor, Invoice, InvoiceItem, log_activity
from utils import role_required, generate_invoice_no

admissions_bp = Blueprint("admissions", __name__, url_prefix="/admissions")

@admissions_bp.route("/")
@login_required
def index():
    status_filter = request.args.get("status", "Admitted")
    if status_filter == "all":
        admissions = Admission.query.order_by(Admission.admission_date.desc()).all()
    else:
        admissions = Admission.query.filter_by(status=status_filter).order_by(Admission.admission_date.desc()).all()

    wards = Ward.query.all()
    all_beds = Bed.query.all()
    
    return render_template(
        "admissions/index.html",
        admissions=admissions,
        wards=wards,
        all_beds=all_beds,
        current_status=status_filter
    )

@admissions_bp.route("/beds")
@admissions_bp.route("/rooms")
@login_required
def beds():
    wards = Ward.query.all()
    all_beds = Bed.query.all()
    total_beds = len(all_beds)
    occupied_beds = sum(1 for b in all_beds if b.status == "Occupied")
    available_beds = sum(1 for b in all_beds if b.status == "Available")
    maintenance_beds = sum(1 for b in all_beds if b.status == "Maintenance")
    occupancy_pct = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0
    return render_template(
        "admissions/beds.html",
        wards=wards,
        all_beds=all_beds,
        total_beds=total_beds,
        occupied_beds=occupied_beds,
        available_beds=available_beds,
        maintenance_beds=maintenance_beds,
        occupancy_pct=occupancy_pct
    )

@admissions_bp.route("/beds/<int:bed_id>/status", methods=["POST"])
@login_required
@role_required("admin", "nurse")
def update_bed_status(bed_id):
    bed = Bed.query.get_or_404(bed_id)
    new_status = request.form.get("status")
    if new_status in ["Available", "Maintenance"] and bed.status != "Occupied":
        bed.status = new_status
        db.session.commit()
        log_activity("UPDATE_BED_STATUS", "Bed", bed.id, f"Changed bed {bed.bed_number} status to {new_status}")
        flash(f"Bed {bed.bed_number} status set to {new_status}.", "info")
    else:
        flash("Cannot manually change status of an actively occupied bed without discharging the patient.", "warning")
    return redirect(url_for("admissions.beds"))

@admissions_bp.route("/admit", methods=["GET", "POST"])
@login_required
@role_required("admin", "doctor", "nurse", "receptionist")
def admit():
    patients = Patient.query.order_by(Patient.name.asc()).all()
    doctors = Doctor.query.all()
    available_beds = Bed.query.filter_by(status="Available").all()
    preselected_patient_id = request.args.get("patient_id", type=int)

    if request.method == "POST":
        p_id = request.form.get("patient_id", type=int)
        bed_id = request.form.get("bed_id", type=int)
        doctor_id = request.form.get("doctor_id", type=int)
        reason = request.form.get("reason", "").strip()

        if not (p_id and bed_id and doctor_id):
            flash("All fields are required for patient admission.", "danger")
            return render_template("admissions/form.html", patients=patients, doctors=doctors, available_beds=available_beds, preselected_patient_id=preselected_patient_id)

        # Check double-allocation prevention
        bed = Bed.query.get(bed_id)
        if not bed or bed.status != "Available":
            flash("Selected bed is no longer available. Please select an available bed.", "danger")
            return redirect(url_for("admissions.admit"))

        # Check if patient is already actively admitted
        existing_admission = Admission.query.filter_by(patient_id=p_id, status="Admitted").first()
        if existing_admission:
            flash("This patient is already currently admitted to a bed.", "warning")
            return redirect(url_for("admissions.index"))

        admission = Admission(
            patient_id=p_id,
            bed_id=bed_id,
            doctor_id=doctor_id,
            admission_date=datetime.utcnow(),
            reason=reason,
            status="Admitted"
        )
        bed.status = "Occupied"
        db.session.add(admission)
        db.session.commit()

        log_activity("ADMIT_PATIENT", "Admission", admission.id, f"Admitted patient #{p_id} to Bed {bed.bed_number}")
        flash(f"Patient admitted to Bed {bed.bed_number} ({bed.ward.ward_name}) successfully.", "success")
        return redirect(url_for("admissions.index"))

    return render_template(
        "admissions/form.html",
        patients=patients,
        doctors=doctors,
        available_beds=available_beds,
        preselected_patient_id=preselected_patient_id
    )

@admissions_bp.route("/<int:admission_id>/discharge", methods=["POST"])
@login_required
@role_required("admin", "doctor", "nurse")
def discharge(admission_id):
    admission = Admission.query.get_or_404(admission_id)
    if admission.status != "Admitted":
        flash("Admission record is already discharged.", "warning")
        return redirect(url_for("admissions.index"))

    discharge_summary = request.form.get("discharge_summary", "").strip()
    create_bill = bool(request.form.get("create_bill"))

    admission.discharge_date = datetime.utcnow()
    admission.status = "Discharged"
    admission.discharge_summary = discharge_summary

    # Free up the bed
    if admission.bed:
        admission.bed.status = "Available"

    # Calculate days stayed and optionally generate bill item
    if create_bill:
        days = (admission.discharge_date - admission.admission_date).days
        days = max(1, days)
        daily_rate = admission.bed.daily_rate if admission.bed else Decimal("100.00")
        total_bed_fee = daily_rate * days

        inv = Invoice(
            invoice_no=generate_invoice_no(),
            patient_id=admission.patient_id,
            total_amount=total_bed_fee,
            paid_amount=Decimal("0.00"),
            status="Pending"
        )
        db.session.add(inv)
        db.session.flush()

        inv_item = InvoiceItem(
            invoice_id=inv.id,
            description=f"Inpatient Bed Care: {admission.bed.bed_number} ({admission.bed.ward.ward_name}) - {days} day(s)",
            item_type="Ward",
            quantity=days,
            unit_price=daily_rate,
            total_price=total_bed_fee
        )
        db.session.add(inv_item)

    db.session.commit()
    log_activity("DISCHARGE_PATIENT", "Admission", admission.id, f"Discharged patient #{admission.patient_id} from Bed {admission.bed.bed_number}")
    flash(f"Patient has been discharged and Bed {admission.bed.bed_number} is now available.", "success")
    return redirect(url_for("admissions.index"))
