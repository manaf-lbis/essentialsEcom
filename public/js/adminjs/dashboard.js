
async function loadReport(value) {
  let url = `/admin/getReport/?duration=${value}`;
  if (value === 'custom') {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    if (!startDate || !endDate) return alert('Please select both dates');
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })



  const data = await response.json();

  if (response.ok) {
    animate(data);

    // Refresh graphs with dates if custom
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    refreshGraphs(value, startDate, endDate);

    // Update AOV separately
    if (data.averageOrderValue !== undefined) {
      document.getElementById('aov').innerHTML = `₹ ${Math.round(data.averageOrderValue).toLocaleString()}`;
    }

    // Update Customer Count
    if (data.totalCustomers !== undefined) {
      document.getElementById('customers').innerHTML = data.totalCustomers;
    }

    // Update Recent Orders Table
    if (data.orders) {
      updateRecentOrdersTable(data.orders);
    }

    // Update KPI Cards
    document.getElementById('salesCount').innerHTML = data.salesCount;
    document.getElementById('orderAmount').innerHTML = `₹ ${data.totalAmount.toLocaleString()}`;

    // Note: discount and coupons elements might have been removed or renamed in the new UI layout. 
    // If they are no longer in the specific KPI grid, we can keep them if they exist elsewhere, or remove if obsolete.
    // Based on the new EJS, we don't have IDs 'discount' and 'coupons' in the top grid anymore.
    // However, I will check for their existence before updating to avoid errors.

    if (document.getElementById('discount')) document.getElementById('discount').innerHTML = `₹ ${data.totalDiscount.toLocaleString()}`;
    if (document.getElementById('coupons')) document.getElementById('coupons').innerHTML = `₹ ${data.couponDeduction.toLocaleString()}`;

    // New KPIs
    if (document.getElementById('activeOrders')) document.getElementById('activeOrders').innerHTML = data.activeOrdersCount;
    if (document.getElementById('returns')) document.getElementById('returns').innerHTML = data.returnedCount;
    if (document.getElementById('cancelled')) document.getElementById('cancelled').innerHTML = data.cancelledCount;
    if (document.getElementById('performance')) document.getElementById('performance').innerHTML = `${data.successRate.toFixed(1)}%`;
  }
}

function updateRecentOrdersTable(orders) {
  const tbody = document.querySelector('#recentOrdersTable tbody');
  if (!tbody) return;

  tbody.innerHTML = orders.map(order => `
        <tr>
            <td class="ps-4 border-0">
                <span class="fw-bold text-dark d-block">${order.userName || 'Guest'}</span>
                <span class="text-muted extra-small">${order.paymentId || 'N/A'}</span>
            </td>
            <td class="border-0">
                <span class="text-truncate d-inline-block" style="max-width: 150px;">
                    ${order.orderItems[0]?.productId?.productName || 'N/A'}
                </span>
                ${order.orderItems.length > 1 ? `<span class="badge bg-light text-dark small">+${order.orderItems.length - 1}</span>` : ''}
            </td>
            <td class="border-0 fw-bold">₹${order.finalPrice.toLocaleString()}</td>
            <td class="border-0">
                <span class="badge rounded-pill 
                    ${order.status === 'Delivered' ? 'bg-success-subtle text-success' :
      order.status === 'Cancelled' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'} px-3">
                    ${order.status}
                </span>
            </td>
            <td class="pe-4 text-end border-0 text-muted small">
                ${new Date(order.orderDate).toLocaleDateString()}
            </td>
        </tr>
    `).join('');
}


function downloadPDF() {
  const value = document.getElementById('reportDuration').value;
  let url = `/admin/downloadPDF?duration=${value}`;

  if (value === 'custom') {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }

  window.location.href = url;
}


function downloadExcel() {
  const getVal = (id) => document.getElementById(id) ? document.getElementById(id).textContent : '0';

  const reportData = [
    ["Particulars", "Value"],
    ["Overall Sales Count", getVal('salesCount')],
    ["Overall Order Amount", getVal('orderAmount')],
    ["Total Customers", getVal('customers')],
    ["Active Orders", getVal('activeOrders')],
    ["Returns", getVal('returns')],
    ["Cancelled", getVal('cancelled')],
    ["Performance", getVal('performance')]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(reportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

  XLSX.writeFile(workbook, "SalesReport.xlsx");
}

function applyCustomRange() {
  const duration = document.getElementById('reportDuration').value;
  loadReport(duration);
}


// Count-up Animation Function
function animateCount(elementId, endValue, duration) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const currencyIds = ['orderAmount', 'discount', 'coupons', 'aov'];
  const isCurrency = currencyIds.includes(elementId);

  let startValue = 0;
  // Prevent division by zero or negative duration
  const safeDuration = duration > 0 ? duration : 500;
  const increment = endValue / (safeDuration / 10);

  const interval = setInterval(() => {
    startValue += increment;
    if (startValue >= endValue) {
      clearInterval(interval);
      startValue = endValue;
    }

    // Format based on type
    if (elementId === 'performance') {
      element.textContent = Math.floor(startValue).toFixed(1) + '%';
    } else {
      element.textContent = (isCurrency ? '₹' : '') + Math.floor(startValue).toLocaleString();
    }
  }, 10);
}

// Call the animation functions for each element when the page loads
function animate(data) {
  animateCount("salesCount", data.salesCount, 1000);
  animateCount("orderAmount", data.totalAmount, 500);

  // Check for existence before animating
  if (document.getElementById('discount')) animateCount("discount", data.totalDiscount, 500);
  if (document.getElementById('coupons')) animateCount("coupons", data.couponDeduction, 500);

  if (data.averageOrderValue) {
    animateCount("aov", Math.round(data.averageOrderValue), 500);
  }
  if (data.totalCustomers !== undefined) {
    animateCount("customers", data.totalCustomers, 500);
  }

  // New KPIs animation
  if (data.activeOrdersCount !== undefined) animateCount("activeOrders", data.activeOrdersCount, 500);
  if (data.returnedCount !== undefined) animateCount("returns", data.returnedCount, 500);
  if (data.cancelledCount !== undefined) animateCount("cancelled", data.cancelledCount, 500);
  if (data.successRate !== undefined) animateCount("performance", data.successRate, 500);
};
