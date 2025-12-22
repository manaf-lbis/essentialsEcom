

document.addEventListener('DOMContentLoaded', () => {
    const duration = document.getElementById('reportDuration').value || '1day';
    loadReport(duration);
    refreshGraphs(duration);
});

async function refreshGraphs(duration, start, end) {
    try {
        let url = `/admin/graphReport/?duration=${duration}`;
        if (duration === 'custom') {
            const startDate = start || document.getElementById('startDate').value;
            const endDate = end || document.getElementById('endDate').value;
            url += `&startDate=${startDate}&endDate=${endDate}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const dBdata = await response.json();

        configureSalesTrendChart(dBdata.salesTrend);
        configureCategoryChart(dBdata.topSellingCategorys);
        configureBrandChart(dBdata.topsellingBrand);
    } catch (e) {
        console.error('Error refreshing graphs:', e);
    }
}

function configureSalesTrendChart(salesTrend) {
    const canvas = document.getElementById('graph1');
    if (Chart.getChart(canvas)) Chart.getChart(canvas).destroy();

    const labels = salesTrend.map(s => s.date);
    const data = salesTrend.map(s => s.revenue);

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue (₹)',
                data: data,
                fill: true,
                backgroundColor: gradient,
                borderColor: '#3b82f6',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            return 'Revenue: ₹' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 7 } },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
                    ticks: {
                        font: { size: 10 },
                        callback: function (value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function configureCategoryChart(topSellingCategorys) {
    const canvas = document.getElementById('graph2');
    if (Chart.getChart(canvas)) Chart.getChart(canvas).destroy();

    const labels = topSellingCategorys.map(c => c.categoryName);
    const data = topSellingCategorys.map(c => c.categorySalesCount);

    new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796', '#5a5c69'],
                hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf', '#dda20a', '#be2617', '#60616f', '#373840'],
                hoverBorderColor: "rgba(234, 236, 244, 1)",
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
            },
            cutout: '70%'
        }
    });
}

function configureProductChart(topSellingProducts) {
    const canvas = document.getElementById('graph1');
    if (Chart.getChart(canvas)) Chart.getChart(canvas).destroy();

    const labels = topSellingProducts.map(p => p.productName.substring(0, 15));
    const data = topSellingProducts.map(p => p.sellingCount);

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(78, 115, 223, 0.5)');
    gradient.addColorStop(1, 'rgba(78, 115, 223, 0)');

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales Trend',
                data: data,
                fill: true,
                backgroundColor: gradient,
                borderColor: '#4e73df',
                pointBackgroundColor: '#4e73df',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#4e73df',
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#fff',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return 'Units Sold: ' + context.raw;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
}

function configureBrandChart(topsellingBrand) {

    const labels = []
    const data = []

    topsellingBrand.forEach((brand) => {
        labels.push(brand._id)
        data.push(brand.totalSales)
    });

    const data1 = {
        labels: labels,
        datasets: [{
            label: 'Brand Sales Performance',
            data: data,
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(255, 205, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(201, 203, 207, 0.2)'
            ],
            borderColor: [
                'rgb(255, 99, 132)',
                'rgb(255, 159, 64)',
                'rgb(255, 205, 86)',
                'rgb(75, 192, 192)',
                'rgb(54, 162, 235)',
                'rgb(153, 102, 255)',
                'rgb(201, 203, 207)'
            ],
            borderWidth: 1
        }]
    };

    const config = {
        type: 'bar',
        data: data1,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        },
    };

    const ctx = document.getElementById('graph3').getContext('2d');
    new Chart(ctx, config);

}

