
// document.getElementById('reportDuration').
document.addEventListener('DOMContentLoaded', async () => {
   
    const duration = document.getElementById('reportDuration').value

    const response = await fetch(`/admin/graphReport/?duration=${duration}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })

    const dBdata = await response.json();

    configureProductChart(dBdata.topSellingProducts)
    configureCategoryChart(dBdata.topSellingCategorys)

});


function configureCategoryChart(topSellingCategorys){

    if (Chart.getChart('graph2')) {
        Chart.getChart('graph2').destroy();
    }

    const labels = []
    const data = []

    topSellingCategorys.forEach((category) => {
        labels.push(category.categoryName)
        data.push(category.categorySalesCount)
    });


    const data1 = {
        labels: labels,
        datasets: [{
        label: 'Selling Count',
        data: data,
        backgroundColor: [
            'rgb(255, 99, 132)',   // Soft Red
            'rgb(54, 162, 235)',   // Sky Blue
            'rgb(255, 205, 86)',   // Bright Yellow
            'rgb(75, 192, 192)',   // Seafoam Green
            'rgb(153, 102, 255)',  // Lavender Purple
            'rgb(255, 159, 64)',   // Orange
            'rgb(201, 203, 207)',  // Light Gray
            'rgb(123, 239, 178)',  // Mint Green
            'rgb(247, 147, 30)',   // Tangerine
            'rgb(231, 76, 60)'     // Coral Red
          ],
        hoverOffset: 4
        }]
    };

    // Configuration for the chart
    const config = {
        type: 'doughnut',
        data: data1,
    };

    // Initialize the chart
    const ctx = document.getElementById('graph2').getContext('2d');
    new Chart(ctx, config);

}





function configureProductChart (topSellingProducts){

    const labels = [];
    const data = [];

    topSellingProducts.forEach((product) => {
        labels.push(product.productName.substring(0,15))
        data.push(product.sellingCount)
    });

    const data1 = {
        labels: labels,
        datasets: [{
        label: 'Selling Count',
        data: data,
        backgroundColor: [
            'rgb(255, 99, 132)',   // Soft Red
            'rgb(54, 162, 235)',   // Sky Blue
            'rgb(255, 205, 86)',   // Bright Yellow
            'rgb(75, 192, 192)',   // Seafoam Green
            'rgb(153, 102, 255)',  // Lavender Purple
            'rgb(255, 159, 64)',   // Orange
            'rgb(201, 203, 207)',  // Light Gray
            'rgb(123, 239, 178)',  // Mint Green
            'rgb(247, 147, 30)',   // Tangerine
            'rgb(231, 76, 60)'     // Coral Red
          ],
        hoverOffset: 4
        }]
    };

    // Configuration for the chart
    const config = {
        type: 'doughnut',
        data: data1,
    };

    // Initialize the chart
    const ctx = document.getElementById('graph1').getContext('2d');
    new Chart(ctx, config);

}






