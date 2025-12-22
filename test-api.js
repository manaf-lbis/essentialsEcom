const fetch = require('node-fetch');

async function testAPI() {
    console.log('=== TESTING BACKEND APIs ===\n');

    try {
        // Test getReport
        console.log('Testing /admin/getReport/?duration=1day...');
        const reportRes = await fetch('http://localhost:3000/admin/getReport/?duration=1day');
        const reportData = await reportRes.json();

        console.log('Response Status:', reportRes.status);
        console.log('Response Data:', JSON.stringify(reportData, null, 2));

        console.log('\n---\n');

        // Test graphReport
        console.log('Testing /admin/graphReport/?duration=1day...');
        const graphRes = await fetch('http://localhost:3000/admin/graphReport/?duration=1day');
        const graphData = await graphRes.json();

        console.log('Response Status:', graphRes.status);
        console.log('Sales Trend items:', graphData.salesTrend?.length || 0);
        console.log('Top Products:', graphData.topSellingProducts?.length || 0);

    } catch (err) {
        console.error('API Test Error:', err.message);
    }
}

testAPI();
