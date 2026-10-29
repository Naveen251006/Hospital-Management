/**
 * Hospital Management System (HMS) - Interactive Client Logic
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Mobile Sidebar Toggle
  const toggleBtn = document.getElementById("sidebar-toggle-btn");
  const sidebar = document.querySelector(".app-sidebar");
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", function () {
      sidebar.classList.toggle("show");
    });
  }

  // 2. Auto-dismiss alerts after 5 seconds
  const alerts = document.querySelectorAll(".alert-dismissible");
  alerts.forEach(function (alert) {
    setTimeout(function () {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      if (bsAlert) bsAlert.close();
    }, 5000);
  });

  // 3. Dynamic Prescription Item Builder in Medical Records
  const addRxBtn = document.getElementById("add-rx-row-btn");
  const rxContainer = document.getElementById("rx-items-container");
  if (addRxBtn && rxContainer) {
    addRxBtn.addEventListener("click", function () {
      const firstRow = rxContainer.querySelector(".rx-item-row");
      if (firstRow) {
        const newRow = firstRow.cloneNode(true);
        // Clear inputs in cloned row
        newRow.querySelectorAll("input").forEach((inp) => (inp.value = ""));
        newRow.querySelectorAll("select").forEach((sel) => (sel.selectedIndex = 0));
        // Add remove button listener
        const removeBtn = newRow.querySelector(".remove-rx-row-btn");
        if (removeBtn) {
          removeBtn.addEventListener("click", function () {
            newRow.remove();
          });
        }
        rxContainer.appendChild(newRow);
      }
    });

    rxContainer.querySelectorAll(".remove-rx-row-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        if (rxContainer.querySelectorAll(".rx-item-row").length > 1) {
          btn.closest(".rx-item-row").remove();
        }
      });
    });
  }

  // 4. Dynamic Invoice Items & Grand Total Calculator
  const addInvoiceRowBtn = document.getElementById("add-invoice-row-btn");
  const invoiceContainer = document.getElementById("invoice-items-container");
  const grandTotalDisplay = document.getElementById("invoice-grand-total");

  function calculateInvoiceTotals() {
    if (!invoiceContainer || !grandTotalDisplay) return;
    let total = 0;
    const rows = invoiceContainer.querySelectorAll(".invoice-item-row");
    rows.forEach(function (row) {
      const qtyInput = row.querySelector(".item-qty");
      const priceInput = row.querySelector(".item-price");
      const rowTotalDisplay = row.querySelector(".item-row-total");

      const qty = parseFloat(qtyInput ? qtyInput.value : 1) || 0;
      const price = parseFloat(priceInput ? priceInput.value : 0) || 0;
      const rowTotal = qty * price;

      if (rowTotalDisplay) {
        rowTotalDisplay.textContent = "$" + rowTotal.toFixed(2);
      }
      total += rowTotal;
    });
    grandTotalDisplay.textContent = "$" + total.toFixed(2);
  }

  if (addInvoiceRowBtn && invoiceContainer) {
    addInvoiceRowBtn.addEventListener("click", function () {
      const firstRow = invoiceContainer.querySelector(".invoice-item-row");
      if (firstRow) {
        const newRow = firstRow.cloneNode(true);
        newRow.querySelectorAll("input").forEach((inp) => {
          if (inp.classList.contains("item-qty")) inp.value = "1";
          else inp.value = "";
        });
        newRow.querySelectorAll("select").forEach((sel) => (sel.selectedIndex = 0));

        const removeBtn = newRow.querySelector(".remove-invoice-row-btn");
        if (removeBtn) {
          removeBtn.addEventListener("click", function () {
            newRow.remove();
            calculateInvoiceTotals();
          });
        }

        invoiceContainer.appendChild(newRow);
        attachCalculationListeners(newRow);
        calculateInvoiceTotals();
      }
    });

    function attachCalculationListeners(row) {
      const qtyInput = row.querySelector(".item-qty");
      const priceInput = row.querySelector(".item-price");
      if (qtyInput) qtyInput.addEventListener("input", calculateInvoiceTotals);
      if (priceInput) priceInput.addEventListener("input", calculateInvoiceTotals);
      const removeBtn = row.querySelector(".remove-invoice-row-btn");
      if (removeBtn) {
        removeBtn.addEventListener("click", function () {
          if (invoiceContainer.querySelectorAll(".invoice-item-row").length > 1) {
            row.remove();
            calculateInvoiceTotals();
          }
        });
      }
    }

    invoiceContainer.querySelectorAll(".invoice-item-row").forEach(attachCalculationListeners);
    calculateInvoiceTotals();
  }

  // 5. Client Table Search Helper
  const tableSearchInput = document.getElementById("client-table-search");
  if (tableSearchInput) {
    tableSearchInput.addEventListener("keyup", function () {
      const filter = tableSearchInput.value.toLowerCase();
      const rows = document.querySelectorAll(".filterable-table tbody tr");
      rows.forEach(function (row) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
      });
    });
  }
});
