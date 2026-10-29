from decimal import Decimal
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import db
from models import Doctor, Department, User, Appointment, log_activity
from utils import role_required

doctors_bp = Blueprint("doctors", __name__, url_prefix="/doctors")

@doctors_bp.route("/")
@login_required
def index():
    dept_id = request.args.get("dept_id", type=int)
    departments = Department.query.all()
    
    if dept_id:
        doctors = Doctor.query.filter_by(department_id=dept_id).all()
    else:
        doctors = Doctor.query.all()

    return render_template("doctors/index.html", doctors=doctors, departments=departments, selected_dept=dept_id)

@doctors_bp.route("/new", methods=["GET", "POST"])
@login_required
@role_required("admin")
def create():
    departments = Department.query.all()
    if request.method == "POST":
        full_name = request.form.get("full_name", "").strip()
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        department_id = request.form.get("department_id", type=int)
        specialization = request.form.get("specialization", "").strip()
        qualification = request.form.get("qualification", "").strip()
        license_no = request.form.get("license_no", "").strip()
        fee_str = request.form.get("consultation_fee", "50.00").strip()
        available_days = request.form.get("available_days", "Monday to Friday").strip()
        available_time = request.form.get("available_time", "09:00 AM - 05:00 PM").strip()
        room_no = request.form.get("room_no", "").strip()

        if User.query.filter_by(username=username).first():
            flash("Username already taken.", "danger")
            return render_template("doctors/form.html", departments=departments, doctor=None)

        user = User(
            username=username,
            email=email if email else None,
            full_name=full_name,
            role="doctor",
            is_active=True
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        doctor = Doctor(
            user_id=user.id,
            department_id=department_id,
            specialization=specialization,
            qualification=qualification,
            license_no=license_no if license_no else None,
            consultation_fee=Decimal(fee_str),
            available_days=available_days,
            available_time=available_time,
            room_no=room_no
        )
        db.session.add(doctor)
        db.session.commit()

        log_activity("CREATE_DOCTOR", "Doctor", doctor.id, f"Added doctor {full_name} ({specialization})")
        flash(f"Doctor {full_name} successfully added.", "success")
        return redirect(url_for("doctors.index"))

    return render_template("doctors/form.html", departments=departments, doctor=None)

@doctors_bp.route("/<int:doctor_id>")
@login_required
def profile(doctor_id):
    doctor = Doctor.query.get_or_404(doctor_id)
    appointments = doctor.appointments.order_by(Appointment.appointment_date.desc()).limit(15).all()
    return render_template("doctors/profile.html", doctor=doctor, appointments=appointments)

@doctors_bp.route("/<int:doctor_id>/edit", methods=["GET", "POST"])
@login_required
@role_required("admin")
def edit(doctor_id):
    doctor = Doctor.query.get_or_404(doctor_id)
    departments = Department.query.all()

    if request.method == "POST":
        doctor.user.full_name = request.form.get("full_name", "").strip()
        doctor.user.email = request.form.get("email", "").strip() or None
        doctor.department_id = request.form.get("department_id", type=int)
        doctor.specialization = request.form.get("specialization", "").strip()
        doctor.qualification = request.form.get("qualification", "").strip()
        doctor.license_no = request.form.get("license_no", "").strip() or None
        doctor.consultation_fee = Decimal(request.form.get("consultation_fee", "50.00").strip())
        doctor.available_days = request.form.get("available_days", "").strip()
        doctor.available_time = request.form.get("available_time", "").strip()
        doctor.room_no = request.form.get("room_no", "").strip()

        db.session.commit()
        log_activity("UPDATE_DOCTOR", "Doctor", doctor.id, f"Updated profile for {doctor.name}")
        flash(f"Doctor profile for {doctor.name} updated.", "success")
        return redirect(url_for("doctors.profile", doctor_id=doctor.id))

    return render_template("doctors/form.html", departments=departments, doctor=doctor)
