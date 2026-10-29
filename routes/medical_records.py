from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import db
from models import MedicalRecord, Prescription, PrescriptionItem, Patient, Doctor, Medicine, log_activity
from utils import role_required

medical_bp = Blueprint("medical_records", __name__, url_prefix="/medical-records")

@medical_bp.route("/")
@login_required
@role_required("admin", "doctor", "nurse")
def index():
    records = MedicalRecord.query.order_by(MedicalRecord.created_at.desc()).all()
    return render_template("medical_records/index.html", records=records)

@medical_bp.route("/new", methods=["GET", "POST"])
@login_required
@role_required("admin", "doctor")
def create():
    patient_id = request.args.get("patient_id", type=int)
    patients = Patient.query.order_by(Patient.name.asc()).all()
    doctors = Doctor.query.all()
    medicines = Medicine.query.filter(Medicine.quantity > 0).all()

    if request.method == "POST":
        p_id = request.form.get("patient_id", type=int)
        d_id = request.form.get("doctor_id", type=int)
        diagnosis = request.form.get("diagnosis", "").strip()
        symptoms = request.form.get("symptoms", "").strip()
        treatment_notes = request.form.get("treatment_notes", "").strip()
        bp = request.form.get("bp", "").strip()
        pulse = request.form.get("pulse", "").strip()
        temp = request.form.get("temperature", "").strip()
        spo2 = request.form.get("spo2", "").strip()

        if not (p_id and d_id and diagnosis):
            flash("Patient, Doctor, and Diagnosis are required.", "danger")
            return render_template("medical_records/form.html", patients=patients, doctors=doctors, medicines=medicines, preselected_patient_id=p_id)

        rec = MedicalRecord(
            patient_id=p_id,
            doctor_id=d_id,
            diagnosis=diagnosis,
            symptoms=symptoms,
            treatment_notes=treatment_notes,
            bp=bp,
            pulse=pulse,
            temperature=temp,
            spo2=spo2
        )
        db.session.add(rec)
        db.session.flush()

        # Handle Prescriptions if added in the form
        med_ids = request.form.getlist("medicine_id[]")
        dosages = request.form.getlist("dosage[]")
        frequencies = request.form.getlist("frequency[]")
        durations = request.form.getlist("duration[]")
        instructions = request.form.getlist("instructions[]")

        if med_ids and any(med_ids):
            rx = Prescription(
                record_id=rec.id,
                patient_id=p_id,
                doctor_id=d_id,
                notes=request.form.get("prescription_notes", ""),
                status="Pending"
            )
            db.session.add(rx)
            db.session.flush()

            for i in range(len(med_ids)):
                if med_ids[i]:
                    med_obj = Medicine.query.get(int(med_ids[i]))
                    rx_item = PrescriptionItem(
                        prescription_id=rx.id,
                        medicine_id=med_obj.id if med_obj else None,
                        medicine_name=med_obj.medicine_name if med_obj else "Custom Med",
                        dosage=dosages[i] if i < len(dosages) else "As directed",
                        frequency=frequencies[i] if i < len(frequencies) else "Daily",
                        duration=durations[i] if i < len(durations) else "5 days",
                        instructions=instructions[i] if i < len(instructions) else ""
                    )
                    db.session.add(rx_item)

        db.session.commit()
        log_activity("CREATE_MEDICAL_RECORD", "MedicalRecord", rec.id, f"Clinical record #{rec.id} documented for Patient #{p_id}")
        flash("Medical record & prescription created successfully.", "success")
        return redirect(url_for("medical_records.detail", record_id=rec.id))

    return render_template(
        "medical_records/form.html",
        patients=patients,
        doctors=doctors,
        medicines=medicines,
        preselected_patient_id=patient_id
    )

@medical_bp.route("/<int:record_id>")
@login_required
@role_required("admin", "doctor", "nurse")
def detail(record_id):
    record = MedicalRecord.query.get_or_404(record_id)
    return render_template("medical_records/detail.html", record=record)
