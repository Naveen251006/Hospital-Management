from datetime import datetime
from decimal import Decimal
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import db
from models import Invoice, InvoiceItem, Payment, Patient, log_activity
from utils import role_required, generate_invoice_no

billing_bp = Blueprint("billing", __name__, url_prefix="/billing")

@billing_bp.route("/")
@login_required
def index():
    status = request.args.get("status", "")
    query = Invoice.query
    if status:
        query = query.filter(Invoice.status == status)
    invoices = query.order_by(Invoice.created_at.desc()).all()
    
    total_billed = sum(i.total_amount for i in invoices)
    total_collected = sum(i.paid_amount for i in invoices)
    total_outstanding = total_billed - total_collected

    return render_template(
        "billing/index.html",
        invoices=invoices,
        current_status=status,
        total_billed=total_billed,
        total_collected=total_collected,
        total_outstanding=total_outstanding
    )

@billing_bp.route("/new", methods=["GET", "POST"])
@login_required
@role_required("admin", "billing", "receptionist")
def create():
    patients = Patient.query.order_by(Patient.name.asc()).all()
    preselected_patient_id = request.args.get("patient_id", type=int)

    if request.method == "POST":
        p_id = request.form.get("patient_id", type=int)
        descriptions = request.form.getlist("item_description[]")
        item_types = request.form.getlist("item_type[]")
        quantities = request.form.getlist("item_qty[]")
        unit_prices = request.form.getlist("item_price[]")

        if not p_id or not descriptions or not any(descriptions):
            flash("Patient and at least one bill item are required.", "danger")
            return render_template("billing/form.html", patients=patients, preselected_patient_id=p_id)

        inv_no = generate_invoice_no()
        invoice = Invoice(
            invoice_no=inv_no,
            patient_id=p_id,
            total_amount=Decimal("0.00"),
            paid_amount=Decimal("0.00"),
            status="Pending"
        )
        db.session.add(invoice)
        db.session.flush()

        grand_total = Decimal("0.00")
        for i in range(len(descriptions)):
            desc = descriptions[i].strip()
            if not desc:
                continue
            qty = int(quantities[i]) if i < len(quantities) and quantities[i] else 1
            price = Decimal(unit_prices[i]) if i < len(unit_prices) and unit_prices[i] else Decimal("0.00")
            item_total = price * qty
            grand_total += item_total

            item = InvoiceItem(
                invoice_id=invoice.id,
                description=desc,
                item_type=item_types[i] if i < len(item_types) else "Other",
                quantity=qty,
                unit_price=price,
                total_price=item_total
            )
            db.session.add(item)

        invoice.total_amount = grand_total
        db.session.commit()

        log_activity("CREATE_INVOICE", "Invoice", invoice.id, f"Created invoice {inv_no} with total ${grand_total}")
        flash(f"Invoice {inv_no} generated successfully for ${grand_total:,.2f}.", "success")
        return redirect(url_for("billing.invoice_detail", invoice_id=invoice.id))

    return render_template("billing/form.html", patients=patients, preselected_patient_id=preselected_patient_id)

@billing_bp.route("/<int:invoice_id>")
@login_required
def invoice_detail(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    return render_template("billing/detail.html", invoice=invoice)

@billing_bp.route("/<int:invoice_id>/pay", methods=["POST"])
@login_required
@role_required("admin", "billing", "receptionist")
def record_payment(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    amount_str = request.form.get("amount", "0.00").strip()
    method = request.form.get("method", "Cash")
    ref = request.form.get("transaction_ref", "").strip()

    try:
        amount = Decimal(amount_str)
    except Exception:
        flash("Invalid payment amount entered.", "danger")
        return redirect(url_for("billing.invoice_detail", invoice_id=invoice.id))

    if amount <= Decimal("0.00"):
        flash("Payment amount must be greater than zero.", "danger")
        return redirect(url_for("billing.invoice_detail", invoice_id=invoice.id))

    if amount > invoice.balance_due:
        flash(f"Payment amount (${amount}) exceeds balance due (${invoice.balance_due}).", "warning")
        return redirect(url_for("billing.invoice_detail", invoice_id=invoice.id))

    payment = Payment(
        invoice_id=invoice.id,
        amount=amount,
        method=method,
        transaction_ref=ref,
        paid_at=datetime.utcnow()
    )
    db.session.add(payment)

    invoice.paid_amount += amount
    if invoice.paid_amount >= invoice.total_amount:
        invoice.status = "Paid"
    else:
        invoice.status = "Partially Paid"

    db.session.commit()
    log_activity("RECORD_PAYMENT", "Payment", payment.id, f"Recorded payment of ${amount} for Invoice {invoice.invoice_no} via {method}")
    flash(f"Payment of ${amount:,.2f} recorded successfully via {method}.", "success")
    return redirect(url_for("billing.invoice_detail", invoice_id=invoice.id))

@billing_bp.route("/<int:invoice_id>/print")
@login_required
def print_receipt(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    return render_template("billing/receipt_print.html", invoice=invoice)
