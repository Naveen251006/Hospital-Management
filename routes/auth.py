from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app
from flask_login import login_user, logout_user, login_required, current_user
from extensions import db
from models import User, log_activity
from utils import role_required

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        remember = bool(request.form.get("remember"))

        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user, remember=remember)
            log_activity("LOGIN", "User", user.id, f"User {user.username} logged in successfully.", user=user)
            next_page = request.args.get("next")
            return redirect(next_page or url_for("dashboard.index"))
        else:
            flash("Invalid username or password.", "danger")
            return render_template("auth/login.html")

    # If already logged in, go to dashboard
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))

    # Auto-login admin only if explicit demo mode is enabled
    if current_app.config.get("DEMO_AUTO_LOGIN"):
        admin_user = User.query.filter_by(username="admin").first()
        if admin_user:
            login_user(admin_user)
            return redirect(url_for("dashboard.index"))

    return render_template("auth/login.html")

@auth_bp.route("/signup", methods=["GET", "POST"])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))

    if request.method == "POST":
        full_name = request.form.get("full_name", "").strip()
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")
        role = request.form.get("role", "doctor").strip().lower()

        allowed_roles = ["doctor", "nurse", "receptionist", "pharmacist", "lab_tech", "billing", "admin"]
        if role not in allowed_roles:
            role = "doctor"

        if not full_name:
            flash("Please enter your full name.", "danger")
            return render_template("auth/signup.html", full_name=full_name, username=username, email=email, role=role)

        if not username or len(username) < 3:
            flash("Username must be at least 3 characters.", "danger")
            return render_template("auth/signup.html", full_name=full_name, username=username, email=email, role=role)

        if not email or "@" not in email:
            flash("Please enter a valid email address.", "danger")
            return render_template("auth/signup.html", full_name=full_name, username=username, email=email, role=role)

        if not password or len(password) < 4:
            flash("Password must be at least 4 characters long.", "danger")
            return render_template("auth/signup.html", full_name=full_name, username=username, email=email, role=role)

        if password != confirm_password:
            flash("Passwords do not match.", "danger")
            return render_template("auth/signup.html", full_name=full_name, username=username, email=email, role=role)

        if User.query.filter_by(username=username).first():
            flash("That username is already taken. Please choose another.", "danger")
            return render_template("auth/signup.html", full_name=full_name, username=username, email=email, role=role)

        if email and User.query.filter_by(email=email).first():
            flash("That email is already registered. Please sign in instead.", "danger")
            return render_template("auth/signup.html", full_name=full_name, username=username, email=email, role=role)

        new_user = User(
            username=username,
            email=email,
            full_name=full_name,
            role=role,
            is_active=True
        )
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        if role == "doctor":
            from models import Doctor, Department
            dept = Department.query.first()
            dept_id = dept.id if dept else None
            doc_profile = Doctor(
                user_id=new_user.id,
                department_id=dept_id,
                specialization="General Medicine",
                license_no=f"MED-{new_user.id:04d}",
                consultation_fee=50.00
            )
            db.session.add(doc_profile)
            db.session.commit()

        log_activity("SIGNUP", "User", new_user.id, f"User {username} registered successfully as {role}.", user=new_user)
        login_user(new_user)
        flash(f"Account created successfully! Welcome to CarePulse HMS, {full_name}.", "success")
        return redirect(url_for("dashboard.index"))

    return render_template("auth/signup.html")


@auth_bp.route("/quick-login/<role>")
def quick_login(role):
    """Convenient 1-click role switcher for demonstration and staging."""
    if not current_app.config.get("DEMO_ROLE_SWITCHER"):
        flash("Quick role switching is disabled in production.", "danger")
        return redirect(url_for("auth.login"))

    role_map = {
        "admin": "admin",
        "doctor": "dr.smith",
        "receptionist": "reception",
        "nurse": "nurse",
        "lab_tech": "labtech",
        "pharmacist": "pharmacist",
        "billing": "billing"
    }
    username = role_map.get(role, "admin")
    user = User.query.filter_by(username=username).first()
    if user:
        login_user(user)
        log_activity("QUICK_LOGIN", "User", user.id, f"Quick switch to {user.role} role.", user=user)
        flash(f"Switched role to {user.role.upper()} ({user.full_name})", "info")
    else:
        flash("Target user not found.", "warning")
    return redirect(url_for("dashboard.index"))

@auth_bp.route("/logout")
def logout():
    if current_user.is_authenticated:
        log_activity("LOGOUT", "User", current_user.id, f"User {current_user.username} logged out.")
    logout_user()
    if current_app.config.get("DEMO_AUTO_LOGIN"):
        admin_user = User.query.filter_by(username="admin").first()
        if admin_user:
            login_user(admin_user)
        flash("Session reset to Administrator.", "info")
        return redirect(url_for("dashboard.index"))
    flash("You have been successfully logged out.", "info")
    return redirect(url_for("auth.login"))

@auth_bp.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    if request.method == "POST":
        full_name = request.form.get("full_name", "").strip()
        email = request.form.get("email", "").strip()
        current_pw = request.form.get("current_password", "")
        new_pw = request.form.get("new_password", "")

        if full_name:
            current_user.full_name = full_name
        if email:
            current_user.email = email

        if new_pw:
            if not current_user.check_password(current_pw):
                flash("Current password entered is incorrect.", "danger")
                return render_template("auth/profile.html")
            current_user.set_password(new_pw)
            flash("Password updated successfully.", "success")

        db.session.commit()
        log_activity("UPDATE_PROFILE", "User", current_user.id, "Profile information updated.")
        flash("Profile updated successfully.", "success")
        return redirect(url_for("auth.profile"))

    return render_template("auth/profile.html")

@auth_bp.route("/users")
@login_required
@role_required("admin")
def users_list():
    users = User.query.order_by(User.id.asc()).all()
    return render_template("auth/users.html", users=users)

@auth_bp.route("/users/create", methods=["POST"])
@login_required
@role_required("admin")
def create_user():
    username = request.form.get("username", "").strip()
    email = request.form.get("email", "").strip()
    full_name = request.form.get("full_name", "").strip()
    password = request.form.get("password", "")
    role = request.form.get("role", "receptionist")

    if User.query.filter((User.username == username) | (User.email == email)).first():
        flash("Username or Email already in use.", "danger")
        return redirect(url_for("auth.users_list"))

    new_user = User(
        username=username,
        email=email if email else None,
        full_name=full_name,
        role=role,
        is_active=True
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    log_activity("CREATE_USER", "User", new_user.id, f"Created new user {username} with role {role}.")
    flash(f"User account '{username}' created successfully.", "success")
    return redirect(url_for("auth.users_list"))

@auth_bp.route("/users/<int:user_id>/toggle-status", methods=["POST"])
@login_required
@role_required("admin")
def toggle_user_status(user_id):
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        flash("You cannot deactivate your own active session.", "warning")
        return redirect(url_for("auth.users_list"))
    user.is_active = not user.is_active
    db.session.commit()
    log_activity("TOGGLE_USER_STATUS", "User", user.id, f"Toggled user active state to {user.is_active}.")
    flash(f"User '{user.username}' status updated to {'Active' if user.is_active else 'Inactive'}.", "info")
    return redirect(url_for("auth.users_list"))
