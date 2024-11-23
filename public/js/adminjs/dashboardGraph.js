
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

    configureProductChart(dBdata.topSellingProducts);
    configureCategoryChart(dBdata.topSellingCategorys);
    configureBrandChart(dBdata.topsellingBrand);

});


function configureCategoryChart(topSellingCategorys) {

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



function configureProductChart(topSellingProducts) {

    const labels = [];
    const data = [];

    topSellingProducts.forEach((product) => {
        labels.push(product.productName.substring(0, 15))
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

function configureBrandChart(topsellingBrand){

    const labels = []
    const data = []

    topsellingBrand.forEach((brand) => {
        labels.push(brand._id)
        data.push(brand.totalSales)
    });




  const data1 = {
  labels: labels,
  datasets: [{
    label: 'My First Dataset',
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

   // Initialize the chart
   const ctx = document.getElementById('graph3').getContext('2d');
   new Chart(ctx, config);


}






