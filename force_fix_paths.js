const fs = require('fs');
const path = require('path');

const filesToFix = [
    'views/user/purchase/checkout.ejs',
    'views/user/purchase/orderDetails.ejs',
    'views/user/purchase/wishlist.ejs'
];

filesToFix.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    try {
        if (fs.existsSync(fullPath)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            // Regex to match '.. /../' with any amount of spaces
            const regex = /\.\.\s+\/\.\.\//g;

            if (regex.test(content)) {
                console.log(`Fixing ${filePath}...`);
                const newContent = content.replace(regex, '../../');
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`SUCCESS: Fixed ${filePath}`);
            } else {
                console.log(`NO CHANGE: ${filePath} does not contain the error.`);
            }
        } else {
            console.log(`FILE NOT FOUND: ${filePath}`);
        }
    } catch (err) {
        console.error(`ERROR processing ${filePath}:`, err.message);
    }
});
