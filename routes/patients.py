from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import db
from models import Patient, Doctor, Ward, Bed, log_activity
from utils import role_required, generate_patient_no

patients_bp = Blueprint("patients", __name__, url_prefix="/patients")

@patients_bp.route("", methods=["GET", "POST"])
@patients_bp.route("/", methods=["GET", "POST"])
@login_required
def index():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        phone = request.form.get("phone", "").strip()
        address = request.form.get("address", "").strip()

        if not name:
            return "Patient name is required.", 400

        patient = Patient(
            patient_no=generate_patient_no(),
            name=name,
            phone=phone or None,
            address=address or None
        )
        db.session.add(patient)
        db.session.commit()
        flash(f"Patient {patient.name} registered successfully ({patient.patient_no}).", "success")
        return redirect(url_for("patients.index"))

    query = request.args.get("q", "").strip()
    if query:
        search_filter = (
            Patient.name.ilike(f"%{query}%") |
            Patient.patient_no.ilike(f"%{query}%") |
            Patient.phone.ilike(f"%{query}%")
        )
        patients = Patient.query.filter(search_filter).order_by(Patient.created_at.desc()).all()
    else:
        patients = Patient.query.order_by(Patient.created_at.desc()).all()

    return render_template("patients/index.html", patients=patients, query=query)

@patients_bp.route("/new", methods=["GET", "POST"])
@login_required
@role_required("admin", "receptionist", "doctor", "nurse")
def register():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        dob_str = request.form.get("date_of_birth", "").strip()
        gender = request.form.get("gender", "")
        phone = request.form.get("phone", "").strip()
        email = request.form.get("email", "").strip()
        address = request.form.get("address", "").strip()
        blood_group = request.form.get("blood_group", "")
        emergency_contact = request.form.get("emergency_contact", "").strip()
        allergies = request.form.get("allergies", "").strip()

        if not name:
            flash("Patient name is required.", "danger")
            return render_template("patients/form.html")

        dob = None
        if dob_str:
            try:
                dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
            except ValueError:
                pass

        patient_no = generate_patient_no()
        patient = Patient(
            patient_no=patient_no,
            name=name,
            date_of_birth=dob,
            gender=gender,
            phone=phone,
            email=email if email else None,
            address=address,
            blood_group=blood_group,
            emergency_contact=emergency_contact,
            allergies=allergies
        )

        db.session.add(patient)
        db.session.commit()

        log_activity("REGISTER_PATIENT", "Patient", patient.id, f"Registered patient {name} ({patient_no})")
        flash(f"Patient {name} successfully registered with ID {patient_no}!", "success")
        return redirect(url_for("patients.profile", patient_id=patient.id))

    return render_template("patients/form.html", patient=None, auto_patient_no=generate_patient_no())

@patients_bp.route("/<int:patient_id>")
@login_required
def profile(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    doctors = Doctor.query.all()
    available_beds = Bed.query.filter_by(status="Available").all()
    
    return render_template(
        "patients/profile.html",
        patient=patient,
        doctors=doctors,
        available_beds=available_beds
    )

@patients_bp.route("/<int:patient_id>/edit", methods=["GET", "POST"])
@login_required
@role_required("admin", "receptionist", "doctor", "nurse")
def edit(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    if request.method == "POST":
        patient.name = request.form.get("name", "").strip()
        dob_str = request.form.get("date_of_birth", "").strip()
        if dob_str:
            try:
                patient.date_of_birth = datetime.strptime(dob_str, "%Y-%m-%d").date()
            except ValueError:
                pass
        patient.gender = request.form.get("gender", "")
        patient.phone = request.form.get("phone", "").strip()
        patient.email = request.form.get("email", "").strip() or None
        patient.address = request.form.get("address", "").strip()
        patient.blood_group = request.form.get("blood_group", "")
        patient.emergency_contact = request.form.get("emergency_contact", "").strip()
        patient.allergies = request.form.get("allergies", "").strip()

        db.session.commit()
        log_activity("UPDATE_PATIENT", "Patient", patient.id, f"Updated profile details for {patient.name}")
        flash("Patient profile updated successfully.", "success")
        return redirect(url_for("patients.profile", patient_id=patient.id))

    return render_template("patients/form.html", patient=patient, auto_patient_no=patient.patient_no)

@patients_bp.route("/<int:patient_id>/delete", methods=["POST"])
@login_required
@role_required("admin")
def delete(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    name = patient.name
    p_no = patient.patient_no
    db.session.delete(patient)
    db.session.commit()
    log_activity("DELETE_PATIENT", "Patient", patient_id, f"Deleted patient {name} ({p_no})")
    flash(f"Patient {name} has been deleted.", "info")
    return redirect(url_for("patients.index"))
