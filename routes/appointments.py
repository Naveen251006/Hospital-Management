from datetime import datetime, date
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import db
from models import Appointment, Patient, Doctor, log_activity
from utils import role_required

appointments_bp = Blueprint("appointments", __name__, url_prefix="/appointments")

TIME_SLOTS = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
    "04:00 PM", "04:30 PM", "05:00 PM"
]

@appointments_bp.route("/")
@login_required
def index():
    status = request.args.get("status", "")
    date_filter = request.args.get("date", "")
    doctor_id = request.args.get("doctor_id", type=int)

    query = Appointment.query

    # If logged in user is a doctor, default/filter to their appointments if requested
    if current_user.role == "doctor" and hasattr(current_user, "doctor_profile") and current_user.doctor_profile:
        # If doctor wants to see all or just theirs
        pass

    if status:
        query = query.filter(Appointment.status == status)
    if date_filter:
        try:
            parsed_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
            query = query.filter(Appointment.appointment_date == parsed_date)
        except ValueError:
            pass
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)

    appointments = query.order_by(Appointment.appointment_date.desc(), Appointment.time_slot.asc()).all()
    doctors = Doctor.query.all()

    return render_template(
        "appointments/index.html",
        appointments=appointments,
        doctors=doctors,
        selected_status=status,
        selected_date=date_filter,
        selected_doctor=doctor_id
    )

@appointments_bp.route("/book", methods=["GET", "POST"])
@login_required
@role_required("admin", "receptionist", "doctor", "nurse")
def book():
    patients = Patient.query.order_by(Patient.name.asc()).all()
    doctors = Doctor.query.all()
    preselected_patient_id = request.args.get("patient_id", type=int)

    if request.method == "POST":
        patient_id = request.form.get("patient_id", type=int)
        doctor_id = request.form.get("doctor_id", type=int)
        date_str = request.form.get("appointment_date", "").strip()
        time_slot = request.form.get("time_slot", "").strip()
        reason = request.form.get("reason", "").strip()

        if not (patient_id and doctor_id and date_str and time_slot):
            flash("All fields are required to book an appointment.", "danger")
            return render_template("appointments/book.html", patients=patients, doctors=doctors, time_slots=TIME_SLOTS, preselected_patient_id=preselected_patient_id)

        try:
            apt_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            flash("Invalid date format provided.", "danger")
            return render_template("appointments/book.html", patients=patients, doctors=doctors, time_slots=TIME_SLOTS, preselected_patient_id=preselected_patient_id)

        # Collision prevention: Prevent overlapping appointments for the same doctor and slot
        existing_conflict = Appointment.query.filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == apt_date,
            Appointment.time_slot == time_slot,
            Appointment.status.in_(["Scheduled", "In-Progress"])
        ).first()

        if existing_conflict:
            flash(f"Doctor already has an active appointment at {time_slot} on {apt_date}. Please choose another time slot or date.", "warning")
            return render_template("appointments/book.html", patients=patients, doctors=doctors, time_slots=TIME_SLOTS, preselected_patient_id=patient_id)

        appointment = Appointment(
            patient_id=patient_id,
            doctor_id=doctor_id,
            appointment_date=apt_date,
            time_slot=time_slot,
            status="Scheduled",
            reason=reason
        )
        db.session.add(appointment)
        db.session.commit()

        pat = Patient.query.get(patient_id)
        doc = Doctor.query.get(doctor_id)
        log_activity("BOOK_APPOINTMENT", "Appointment", appointment.id, f"Booked appointment for {pat.name} with {doc.name} on {apt_date} {time_slot}")
        flash(f"Appointment booked successfully for {pat.name} with {doc.name}!", "success")
        return redirect(url_for("appointments.index"))

    return render_template("appointments/book.html", patients=patients, doctors=doctors, time_slots=TIME_SLOTS, preselected_patient_id=preselected_patient_id)

@appointments_bp.route("/<int:appointment_id>/update-status", methods=["POST"])
@login_required
@role_required("admin", "doctor", "receptionist", "nurse")
def update_status(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    new_status = request.form.get("status", "Scheduled")
    
    if new_status in ["Scheduled", "In-Progress", "Completed", "Cancelled"]:
        appointment.status = new_status
        db.session.commit()
        log_activity("UPDATE_APPOINTMENT_STATUS", "Appointment", appointment.id, f"Updated status to {new_status}")
        flash(f"Appointment #{appointment.id} status changed to {new_status}.", "info")

    return redirect(request.referrer or url_for("appointments.index"))

@appointments_bp.route("/<int:appointment_id>/reschedule", methods=["POST"])
@login_required
@role_required("admin", "doctor", "receptionist")
def reschedule(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    new_date_str = request.form.get("appointment_date", "").strip()
    new_time_slot = request.form.get("time_slot", "").strip()

    try:
        new_date = datetime.strptime(new_date_str, "%Y-%m-%d").date()
    except ValueError:
        flash("Invalid date format.", "danger")
        return redirect(url_for("appointments.index"))

    # Overlap check
    conflict = Appointment.query.filter(
        Appointment.id != appointment.id,
        Appointment.doctor_id == appointment.doctor_id,
        Appointment.appointment_date == new_date,
        Appointment.time_slot == new_time_slot,
        Appointment.status.in_(["Scheduled", "In-Progress"])
    ).first()

    if conflict:
        flash(f"Cannot reschedule: Doctor has a conflicting appointment at {new_time_slot} on {new_date}.", "warning")
        return redirect(url_for("appointments.index"))

    appointment.appointment_date = new_date
    appointment.time_slot = new_time_slot
    appointment.status = "Scheduled"
    db.session.commit()

    log_activity("RESCHEDULE_APPOINTMENT", "Appointment", appointment.id, f"Rescheduled to {new_date} at {new_time_slot}")
    flash("Appointment rescheduled successfully.", "success")
    return redirect(url_for("appointments.index"))
