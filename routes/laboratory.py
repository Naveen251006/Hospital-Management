from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import db
from models import LabOrder, LabResult, Patient, Doctor, log_activity
from utils import role_required

laboratory_bp = Blueprint("laboratory", __name__, url_prefix="/laboratory")

COMMON_TESTS = [
    ("Complete Blood Count (CBC)", "Hematology"),
    ("Lipid Panel Profile", "Biochemistry"),
    ("Comprehensive Metabolic Panel (CMP)", "Biochemistry"),
    ("Fasting Blood Sugar (FBS)", "Biochemistry"),
    ("HbA1c Glycated Hemoglobin", "Biochemistry"),
    ("Thyroid Function Test (TSH, T3, T4)", "Biochemistry"),
    ("Urinalysis Routine & Microscopy", "Pathology"),
    ("Chest X-Ray (PA View)", "Radiology"),
    ("Electrocardiogram (ECG)", "Cardiology"),
    ("Liver Function Test (LFT)", "Biochemistry"),
    ("Serum Electrolytes (Na, K, Cl)", "Biochemistry"),
]

@laboratory_bp.route("/")
@login_required
def index():
    status = request.args.get("status", "")
    query = LabOrder.query
    if status:
        query = query.filter(LabOrder.status == status)
    orders = query.order_by(LabOrder.ordered_at.desc()).all()
    return render_template("laboratory/index.html", orders=orders, current_status=status)

@laboratory_bp.route("/order", methods=["GET", "POST"])
@login_required
@role_required("admin", "doctor", "nurse")
def order():
    patients = Patient.query.order_by(Patient.name.asc()).all()
    doctors = Doctor.query.all()
    preselected_patient_id = request.args.get("patient_id", type=int)

    if request.method == "POST":
        p_id = request.form.get("patient_id", type=int)
        d_id = request.form.get("doctor_id", type=int)
        test_name = request.form.get("test_name", "").strip()
        custom_test = request.form.get("custom_test", "").strip()
        test_category = request.form.get("test_category", "Hematology")

        final_test_name = custom_test if custom_test else test_name
        if not (p_id and d_id and final_test_name):
            flash("Patient, Doctor, and Test Name are required.", "danger")
            return render_template("laboratory/order.html", patients=patients, doctors=doctors, common_tests=COMMON_TESTS, preselected_patient_id=p_id)

        lab_order = LabOrder(
            patient_id=p_id,
            doctor_id=d_id,
            test_name=final_test_name,
            test_category=test_category,
            status="Pending"
        )
        db.session.add(lab_order)
        db.session.commit()

        pat = Patient.query.get(p_id)
        log_activity("ORDER_LAB_TEST", "LabOrder", lab_order.id, f"Ordered {final_test_name} for patient {pat.name}")
        flash(f"Laboratory order for '{final_test_name}' submitted.", "success")
        return redirect(url_for("laboratory.index"))

    return render_template("laboratory/order.html", patients=patients, doctors=doctors, common_tests=COMMON_TESTS, preselected_patient_id=preselected_patient_id)

@laboratory_bp.route("/<int:order_id>/results", methods=["GET", "POST"])
@login_required
@role_required("admin", "lab_tech", "doctor")
def enter_results(order_id):
    order = LabOrder.query.get_or_404(order_id)

    if request.method == "POST":
        result_summary = request.form.get("result_summary", "").strip()
        reference_range = request.form.get("reference_range", "").strip()
        flag = request.form.get("flag", "Normal")
        notes = request.form.get("technician_notes", "").strip()

        if not result_summary:
            flash("Diagnostic result summary is required.", "danger")
            return render_template("laboratory/results_form.html", order=order)

        if order.result:
            # Update existing
            order.result.result = result_summary
            order.result.result_summary = result_summary
            order.result.reference_range = reference_range
            order.result.flag = flag
            order.result.technician_notes = notes
            order.result.reported_at = datetime.utcnow()
        else:
            result = LabResult(
                lab_order_id=order.id,
                result=result_summary,
                result_summary=result_summary,
                reference_range=reference_range,
                flag=flag,
                technician_notes=notes
            )
            db.session.add(result)

        order.status = "Completed"
        db.session.commit()

        log_activity("RECORD_LAB_RESULT", "LabResult", order.id, f"Recorded result for order #{order.id} ({order.test_name}) - Flag: {flag}")
        flash(f"Laboratory findings for #{order.id} saved successfully.", "success")
        return redirect(url_for("laboratory.view_report", order_id=order.id))

    return render_template("laboratory/results_form.html", order=order)

@laboratory_bp.route("/<int:order_id>/report")
@login_required
def view_report(order_id):
    order = LabOrder.query.get_or_404(order_id)
    return render_template("laboratory/report.html", order=order)
