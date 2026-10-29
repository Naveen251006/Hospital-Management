from decimal import Decimal
from datetime import date
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import db
from models import Staff, Department, User, log_activity
from utils import role_required

staff_bp = Blueprint("staff", __name__, url_prefix="/staff")

@staff_bp.route("/")
@login_required
def index():
    staff_members = Staff.query.all()
    departments = Department.query.all()
    return render_template("staff/index.html", staff_members=staff_members, departments=departments)

@staff_bp.route("/new", methods=["GET", "POST"])
@login_required
@role_required("admin")
def create():
    departments = Department.query.all()
    if request.method == "POST":
        full_name = request.form.get("full_name", "").strip()
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        role = request.form.get("role", "nurse")
        department_id = request.form.get("department_id", type=int)
        job_title = request.form.get("job_title", "").strip()
        phone = request.form.get("phone", "").strip()
        shift = request.form.get("shift", "Morning")
        salary_str = request.form.get("salary", "3000.00").strip()

        if User.query.filter_by(username=username).first():
            flash("Username already exists.", "danger")
            return render_template("staff/form.html", departments=departments, staff=None)

        user = User(
            username=username,
            email=email if email else None,
            full_name=full_name,
            role=role,
            is_active=True
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        staff = Staff(
            user_id=user.id,
            department_id=department_id,
            job_title=job_title,
            phone=phone,
            shift=shift,
            salary=Decimal(salary_str),
            joining_date=date.today(),
            status="Active"
        )
        db.session.add(staff)
        db.session.commit()

        log_activity("CREATE_STAFF", "Staff", staff.id, f"Added staff member {full_name} ({job_title})")
        flash(f"Staff member {full_name} registered successfully.", "success")
        return redirect(url_for("staff.index"))

    return render_template("staff/form.html", departments=departments, staff=None)

@staff_bp.route("/<int:staff_id>/edit", methods=["GET", "POST"])
@login_required
@role_required("admin")
def edit(staff_id):
    staff = Staff.query.get_or_404(staff_id)
    departments = Department.query.all()

    if request.method == "POST":
        staff.user.full_name = request.form.get("full_name", "").strip()
        staff.user.email = request.form.get("email", "").strip() or None
        staff.department_id = request.form.get("department_id", type=int)
        staff.job_title = request.form.get("job_title", "").strip()
        staff.phone = request.form.get("phone", "").strip()
        staff.shift = request.form.get("shift", "Morning")
        staff.status = request.form.get("status", "Active")
        staff.salary = Decimal(request.form.get("salary", "3000.00").strip())

        db.session.commit()
        log_activity("UPDATE_STAFF", "Staff", staff.id, f"Updated staff details for {staff.name}")
        flash(f"Staff profile for {staff.name} updated.", "success")
        return redirect(url_for("staff.index"))

    return render_template("staff/form.html", departments=departments, staff=staff)
