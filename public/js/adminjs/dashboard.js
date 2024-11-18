
async function loadReport(value) {

    const response = await fetch(`/admin/getReport/?duration=${value}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })

    
    
   const data = await response.json();

    if (response.ok) {
        animate(data)
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


  function downloadExcel() {
    const reportData = [
        ["Particulars", "Value"],
        ["Overall Sales Count", document.getElementById('salesCount').innerHTML],
        ["Overall Order Amount", "₹ " +  document.getElementById('orderAmount').innerHTML],
        ["Overall Discount Amount", "₹ " +  document.getElementById('discount').innerHTML],
        ["Coupons Deduction", "₹ " + document.getElementById('coupons').innerHTML]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

    XLSX.writeFile(workbook, "SalesReport.xlsx");
}


// Count-up Animation Function
function animateCount(elementId, endValue, duration) {
  const element = document.getElementById(elementId);
  let startValue = 0;
  const increment = endValue / (duration / 10); // Controls the speed of the count-up

  const interval = setInterval(() => {
      startValue += increment;
      if (startValue >= endValue) {
          clearInterval(interval);
          startValue = endValue; // Stop at exact value
      }
      element.textContent = '₹ ' + Math.floor(startValue).toLocaleString(); // Format with INR and commas
  }, 10);
}

// Call the animation functions for each element when the page loads
function animate(data) {
  animateCount("salesCount", data.salesCount, 1000);
  animateCount("orderAmount", data.totalAmount.toFixed(2), 500);
  animateCount("discount", data.totalDiscount.toFixed(2) , 500);
  animateCount("coupons", data.couponDeduction.toFixed(2) , 500);
};


