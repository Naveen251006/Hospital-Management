import os
from flask import Flask, render_template, redirect, url_for
from config import Config
from extensions import db, login_manager, migrate
from seed import seed_database

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)

    # Register Blueprints
    from routes.auth import auth_bp
    from routes.dashboard import dashboard_bp
    from routes.patients import patients_bp
    from routes.doctors import doctors_bp
    from routes.appointments import appointments_bp
    from routes.medical_records import medical_bp
    from routes.admissions import admissions_bp
    from routes.laboratory import laboratory_bp
    from routes.pharmacy import pharmacy_bp
    from routes.billing import billing_bp
    from routes.staff import staff_bp
    from routes.reports import reports_bp
    from routes.audit import audit_bp
    from routes.notifications import notifications_bp, get_system_notifications
    from routes.departments import departments_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(patients_bp)
    app.register_blueprint(doctors_bp)
    app.register_blueprint(appointments_bp)
    app.register_blueprint(medical_bp)
    app.register_blueprint(admissions_bp)
    app.register_blueprint(laboratory_bp)
    app.register_blueprint(pharmacy_bp)
    app.register_blueprint(billing_bp)
    app.register_blueprint(staff_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(departments_bp)

    # Alias endpoints for tutorial starter compatibility (url_for('patients'), url_for('dashboard'))
    def alias_build_error_handler(error, endpoint, values):
        aliases = {
            "patients": "patients.index",
            "dashboard": "dashboard.index",
            "login": "auth.login",
            "signup": "auth.signup",
        }
        if endpoint in aliases:
            return url_for(aliases[endpoint], **values)
        return None
    app.url_build_error_handlers.append(alias_build_error_handler)

    # Authenticate default administrator only if explicitly enabled in demo mode
    @app.before_request
    def ensure_authenticated():
        if app.config.get("DEMO_AUTO_LOGIN"):
            from flask_login import current_user, login_user
            from models import User
            if not current_user.is_authenticated:
                admin_user = User.query.filter_by(username="admin").first()
                if admin_user:
                    login_user(admin_user)

    # Security Headers Middleware
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
            "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; "
            "img-src 'self' data: https:; "
            "connect-src 'self'; "
            "frame-ancestors 'self';"
        )
        return response

    # Context processor for global badge counts & alert notifications
    @app.context_processor
    def inject_global_metrics():
        try:
            from models import Medicine, Appointment, LabOrder, Bed, Department
            from datetime import date
            low_stock_count = Medicine.query.filter(Medicine.quantity <= Medicine.reorder_level).count()
            today_apt_count = Appointment.query.filter_by(appointment_date=date.today(), status="Scheduled").count()
            pending_lab_count = LabOrder.query.filter_by(status="Pending").count()
            total_beds_count = Bed.query.count()
            occupied_beds_count = Bed.query.filter_by(status="Occupied").count()
            dept_count = Department.query.count()
            system_alerts = get_system_notifications()
            return {
                "global_low_stock_count": low_stock_count,
                "global_today_apt_count": today_apt_count,
                "global_pending_lab_count": pending_lab_count,
                "global_total_beds_count": total_beds_count or 12,
                "global_occupied_beds_count": occupied_beds_count or 7,
                "global_dept_count": dept_count or 8,
                "global_alerts": system_alerts,
                "global_alerts_count": len(system_alerts),
                "demo_role_switcher": app.config.get("DEMO_ROLE_SWITCHER", False),
                "demo_auto_login": app.config.get("DEMO_AUTO_LOGIN", False)
            }
        except Exception:
            return {
                "global_low_stock_count": 0,
                "global_today_apt_count": 0,
                "global_pending_lab_count": 0,
                "global_total_beds_count": 12,
                "global_occupied_beds_count": 7,
                "global_dept_count": 8,
                "global_alerts": [],
                "global_alerts_count": 0,
                "demo_role_switcher": app.config.get("DEMO_ROLE_SWITCHER", False),
                "demo_auto_login": app.config.get("DEMO_AUTO_LOGIN", False)
            }

    @app.route("/rooms")
    def rooms_redirect():
        return redirect(url_for("admissions.beds"))

    # Health check endpoint (matches tutorial starter specification)
    @app.route("/health")
    def health():
        return {"status": "ok"}

    # Robots.txt to protect hospital private records from crawlers
    @app.route("/robots.txt")
    def robots_txt():
        return (
            "User-agent: *\nDisallow: /\n",
            200,
            {"Content-Type": "text/plain; charset=utf-8"}
        )

    # Custom Error Handlers
    @app.errorhandler(403)
    def forbidden_error(error):
        return render_template("errors/403.html"), 403

    @app.errorhandler(404)
    def not_found_error(error):
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return render_template("errors/500.html"), 500

    # Auto create tables and seed default database
    with app.app_context():
        try:
            db.create_all()
            seed_database()
        except Exception as e:
            print(f"[Database Initialization Warning]: {e}")

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
