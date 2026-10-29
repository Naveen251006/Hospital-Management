from datetime import date, timedelta
from flask import Blueprint, render_template
from flask_login import login_required
from models import Appointment, Medicine, LabOrder, Invoice

notifications_bp = Blueprint("notifications", __name__, url_prefix="/notifications")

def get_system_notifications():
    """Generates real-time active system notifications and alert items."""
    alerts = []
    today = date.today()
    tomorrow = today + timedelta(days=1)

    # 1. Appointment Reminders (Scheduled for today or tomorrow)
    upcoming_apts = Appointment.query.filter(
        Appointment.appointment_date.in_([today, tomorrow]),
        Appointment.status == "Scheduled"
    ).all()
    for apt in upcoming_apts:
        when = "Today" if apt.appointment_date == today else "Tomorrow"
        alerts.append({
            "type": "appointment",
            "category": "info",
            "icon": "bi-calendar-event",
            "title": f"Appointment Reminder ({when})",
            "message": f"{apt.patient.name} with {apt.doctor.name} at {apt.time_slot}",
            "link": "/appointments/",
            "time": f"{when} at {apt.time_slot}"
        })

    # 2. Pharmacy Low-Stock Alerts
    low_stock = Medicine.query.filter(Medicine.quantity <= Medicine.reorder_level).all()
    for med in low_stock:
        alerts.append({
            "type": "pharmacy",
            "category": "danger" if med.quantity == 0 else "warning",
            "icon": "bi-exclamation-triangle",
            "title": "Low Stock Warning" if med.quantity > 0 else "Out of Stock Alert",
            "message": f"{med.medicine_name} has only {med.quantity} unit(s) remaining (Reorder threshold: {med.reorder_level}).",
            "link": "/pharmacy/?alert=low_stock",
            "time": "Immediate Attention"
        })

    # 3. Critical Lab Results
    critical_orders = LabOrder.query.filter_by(status="Completed").all()
    for order in critical_orders:
        if order.result and order.result.flag == "Critical":
            alerts.append({
                "type": "laboratory",
                "category": "danger",
                "icon": "bi-virus2",
                "title": "Critical Laboratory Finding Flagged",
                "message": f"Critical diagnostic result for {order.patient.name} on test: {order.test_name}",
                "link": f"/laboratory/{order.id}/report",
                "time": order.result.reported_at.strftime('%b %d, %H:%M') if order.result.reported_at else "Recent"
            })

    # 4. Pending Billing Settlement
    pending_bills = Invoice.query.filter(Invoice.status.in_(["Pending", "Partially Paid"])).all()
    if pending_bills:
        total_pending_amt = sum(b.balance_due for b in pending_bills)
        alerts.append({
            "type": "billing",
            "category": "primary",
            "icon": "bi-receipt",
            "title": f"{len(pending_bills)} Invoices Awaiting Settlement",
            "message": f"Total outstanding accounts receivable: ${total_pending_amt:,.2f}",
            "link": "/billing/?status=Pending",
            "time": "Active Ledger"
        })

    return alerts

@notifications_bp.route("/")
@login_required
def index():
    alerts = get_system_notifications()
    return render_template("notifications/index.html", alerts=alerts)
