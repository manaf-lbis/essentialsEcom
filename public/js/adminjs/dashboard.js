
async function loadReport(value) {

    const response = await fetch(`/admin/getReport/?duration=${value}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })

   const data = await response.json();

    if (response.ok) {
        document.getElementById('salesCount').innerHTML = `${data.salesCount}`
        document.getElementById('orderAmount').innerHTML = `₹ ${data.totalAmount.toFixed(2)}`
        document.getElementById('discount').innerHTML = `₹ ${data.totalDiscount.toFixed(2)}`
        document.getElementById('coupons').innerHTML = `₹ ${data.couponDeduction.toFixed(2)}`
    }

}


function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Adding title
    doc.setFontSize(16);
    doc.text("Sales Report", 20, 20);

    // Define table data (key-value pairs)
    const rows = [
      ["Overall Sales Count", document.getElementById('salesCount').innerHTML],
      ["Overall Order Amount", document.getElementById('orderAmount').innerHTML],
      ["Overall Discount Amount", document.getElementById('discount').innerHTML],
      ["Coupons Deduction", document.getElementById('coupons').innerHTML]
    ];

    // Adding the table
    doc.autoTable({
      body: rows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255] }, // No fill for header (key)
      bodyStyles: { halign: 'center' },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold', halign: 'left' }, // Key column
        1: { cellWidth: 80, textColor: [40, 167, 69] } // Value column with color
      }
    });

    // Save the PDF
    doc.save("sales_report_key_value_table.pdf");
  }