from datetime import datetime, date
from decimal import Decimal
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import db
from models import Medicine, Prescription, Invoice, InvoiceItem, Patient, log_activity
from utils import role_required, generate_invoice_no

pharmacy_bp = Blueprint("pharmacy", __name__, url_prefix="/pharmacy")

@pharmacy_bp.route("/")
@login_required
def index():
    query = request.args.get("q", "").strip()
    category = request.args.get("category", "")
    alert = request.args.get("alert", "")

    m_query = Medicine.query

    if query:
        m_query = m_query.filter(
            (Medicine.medicine_name.ilike(f"%{query}%")) |
            (Medicine.generic_name.ilike(f"%{query}%")) |
            (Medicine.batch_no.ilike(f"%{query}%"))
        )
    if category:
        m_query = m_query.filter(Medicine.category == category)
    if alert == "low_stock":
        m_query = m_query.filter(Medicine.quantity <= Medicine.reorder_level)
    elif alert == "expired":
        m_query = m_query.filter(Medicine.expiry_date < date.today())

    medicines = m_query.order_by(Medicine.medicine_name.asc()).all()
    categories = db.session.query(Medicine.category).distinct().all()
    categories = [c[0] for c in categories if c[0]]

    low_count = Medicine.query.filter(Medicine.quantity <= Medicine.reorder_level).count()
    expired_count = Medicine.query.filter(Medicine.expiry_date < date.today()).count()

    return render_template(
        "pharmacy/index.html",
        medicines=medicines,
        categories=categories,
        current_query=query,
        current_category=category,
        current_alert=alert,
        low_count=low_count,
        expired_count=expired_count
    )

@pharmacy_bp.route("/new", methods=["GET", "POST"])
@login_required
@role_required("admin", "pharmacist")
def create():
    if request.method == "POST":
        name = request.form.get("medicine_name", "").strip()
        generic = request.form.get("generic_name", "").strip()
        category = request.form.get("category", "Tablet")
        batch_no = request.form.get("batch_no", "").strip()
        quantity = request.form.get("quantity", type=int) or 0
        reorder_level = request.form.get("reorder_level", type=int) or 20
        expiry_str = request.form.get("expiry_date", "").strip()
        unit_price = Decimal(request.form.get("unit_price", "10.00").strip())
        manufacturer = request.form.get("manufacturer", "").strip()

        if not (name and batch_no and expiry_str):
            flash("Medicine name, batch number, and expiry date are required.", "danger")
            return render_template("pharmacy/form.html", medicine=None)

        try:
            exp_date = datetime.strptime(expiry_str, "%Y-%m-%d").date()
        except ValueError:
            flash("Invalid expiry date format.", "danger")
            return render_template("pharmacy/form.html", medicine=None)

        med = Medicine(
            medicine_name=name,
            generic_name=generic,
            category=category,
            batch_no=batch_no,
            quantity=quantity,
            reorder_level=reorder_level,
            expiry_date=exp_date,
            unit_price=unit_price,
            manufacturer=manufacturer
        )
        db.session.add(med)
        db.session.commit()

        log_activity("ADD_MEDICINE", "Medicine", med.id, f"Added {name} (Batch: {batch_no}, Qty: {quantity})")
        flash(f"Medicine '{name}' successfully added to pharmacy inventory.", "success")
        return redirect(url_for("pharmacy.index"))

    return render_template("pharmacy/form.html", medicine=None)

@pharmacy_bp.route("/<int:medicine_id>/edit", methods=["GET", "POST"])
@login_required
@role_required("admin", "pharmacist")
def edit(medicine_id):
    med = Medicine.query.get_or_404(medicine_id)
    if request.method == "POST":
        med.medicine_name = request.form.get("medicine_name", "").strip()
        med.generic_name = request.form.get("generic_name", "").strip()
        med.category = request.form.get("category", "Tablet")
        med.batch_no = request.form.get("batch_no", "").strip()
        med.quantity = request.form.get("quantity", type=int) or 0
        med.reorder_level = request.form.get("reorder_level", type=int) or 20
        expiry_str = request.form.get("expiry_date", "").strip()
        if expiry_str:
            try:
                med.expiry_date = datetime.strptime(expiry_str, "%Y-%m-%d").date()
            except ValueError:
                pass
        med.unit_price = Decimal(request.form.get("unit_price", "10.00").strip())
        med.manufacturer = request.form.get("manufacturer", "").strip()

        db.session.commit()
        log_activity("UPDATE_MEDICINE", "Medicine", med.id, f"Updated stock/details for {med.medicine_name}")
        flash(f"Medicine '{med.medicine_name}' updated successfully.", "success")
        return redirect(url_for("pharmacy.index"))

    return render_template("pharmacy/form.html", medicine=med)

@pharmacy_bp.route("/dispense", methods=["GET", "POST"])
@login_required
@role_required("admin", "pharmacist")
def dispense():
    medicines = Medicine.query.filter(Medicine.quantity > 0).order_by(Medicine.medicine_name.asc()).all()
    patients = Patient.query.order_by(Patient.name.asc()).all()
    pending_prescriptions = Prescription.query.filter_by(status="Pending").order_by(Prescription.created_at.desc()).all()

    if request.method == "POST":
        med_id = request.form.get("medicine_id", type=int)
        dispense_qty = request.form.get("quantity", type=int) or 1
        patient_id = request.form.get("patient_id", type=int)
        prescription_id = request.form.get("prescription_id", type=int)
        create_bill = bool(request.form.get("create_bill"))

        med = Medicine.query.get_or_404(med_id)

        if med.quantity < dispense_qty:
            flash(f"Insufficient stock for {med.medicine_name}. Available: {med.quantity}, Requested: {dispense_qty}", "danger")
            return redirect(url_for("pharmacy.dispense"))

        # Decrement stock safely
        med.quantity -= dispense_qty

        # If linked to prescription, check if finished
        if prescription_id:
            rx = Prescription.query.get(prescription_id)
            if rx:
                rx.status = "Dispensed"

        # Generate invoice if requested
        if create_bill and patient_id:
            total_cost = med.unit_price * dispense_qty
            inv = Invoice(
                invoice_no=generate_invoice_no(),
                patient_id=patient_id,
                total_amount=total_cost,
                paid_amount=Decimal("0.00"),
                status="Pending"
            )
            db.session.add(inv)
            db.session.flush()

            inv_item = InvoiceItem(
                invoice_id=inv.id,
                description=f"Pharmacy Dispense: {med.medicine_name} (x{dispense_qty})",
                item_type="Pharmacy",
                quantity=dispense_qty,
                unit_price=med.unit_price,
                total_price=total_cost
            )
            db.session.add(inv_item)

        db.session.commit()
        log_activity("DISPENSE_MEDICINE", "Medicine", med.id, f"Dispensed {dispense_qty} units of {med.medicine_name}")
        flash(f"Successfully dispensed {dispense_qty} unit(s) of {med.medicine_name}. Stock remaining: {med.quantity}", "success")
        return redirect(url_for("pharmacy.index"))

    return render_template(
        "pharmacy/dispense.html",
        medicines=medicines,
        patients=patients,
        pending_prescriptions=pending_prescriptions
    )
