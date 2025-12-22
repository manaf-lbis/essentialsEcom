const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

const viewsDir = path.join(__dirname, 'views');
const filename = path.join(viewsDir, 'user/purchase/orders.ejs');

async function testRender() {
    try {
        console.log('Testing EJS compilation for:', filename);

        // Mock data required by the template
        const data = {
            orders: [],
            currentpage: 1,
            userData: { name: 'Test User', email: 'test@test.com' }, // For partials
            activePage: 'orders'
        };

        // Render the file
        // We need to set the root for include resolution
        ejs.renderFile(filename, data, { root: viewsDir }, (err, str) => {
            if (err) {
                console.error('Compilation Failed!');
                fs.writeFileSync('result.txt', err.message);
                console.error(err);
                if (err.path) console.error('Error path:', err.path);
                process.exit(1);
            } else {
                console.log('Compilation Success!');
                console.log('Template length:', str.length);
                process.exit(0);
            }
        });

    } catch (e) {
        console.error('Unexpected error:', e);
        process.exit(1);
    }
}

testRender();
