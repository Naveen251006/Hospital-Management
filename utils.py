from functools import wraps
from flask import flash, redirect, url_for, abort, request
from flask_login import current_user
from models import log_activity

def role_required(*roles):
    """
    Decorator to restrict route access to specific roles.
    Administrators are always granted access by default.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                flash("Please log in to access this page.", "warning")
                return redirect(url_for("auth.login", next=request.url))
            
            if not current_user.has_role(*roles):
                flash(f"Access denied: This action requires one of the following roles: {', '.join(roles)}.", "danger")
                return redirect(url_for("dashboard.index"))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def generate_patient_no():
    """Generates unique patient registration number e.g. PAT-2026-0005"""
    from datetime import date
    from models import Patient
    year = date.today().year
    last_patient = Patient.query.order_by(Patient.id.desc()).first()
    next_id = (last_patient.id + 1) if last_patient else 1
    return f"PAT-{year}-{next_id:04d}"

def generate_invoice_no():
    """Generates unique invoice number e.g. INV-2026-0005"""
    from datetime import date
    from models import Invoice
    year = date.today().year
    last_inv = Invoice.query.order_by(Invoice.id.desc()).first()
    next_id = (last_inv.id + 1) if last_inv else 1
    return f"INV-{year}-{next_id:04d}"
