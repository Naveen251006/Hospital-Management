from flask import Blueprint, render_template
from flask_login import login_required
from models import Department

departments_bp = Blueprint("departments", __name__, url_prefix="/departments")

@departments_bp.route("/")
@login_required
def index():
    departments = Department.query.order_by(Department.id).all()
    return render_template("departments/index.html", departments=departments)

