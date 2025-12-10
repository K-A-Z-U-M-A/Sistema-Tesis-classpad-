const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'Dashboard.jsx');
const headerPath = path.join(__dirname, 'header.txt');

try {
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    const headerContent = fs.readFileSync(headerPath, 'utf8');

    // Find the split point
    const splitMarker = 'const loadDashboardData = async () => {';
    const splitIndex = dashboardContent.indexOf(splitMarker);

    if (splitIndex === -1) {
        console.error('Could not find split point!');
        console.log('File start content:', dashboardContent.substring(0, 200));
        process.exit(1);
    }

    const body = dashboardContent.substring(splitIndex);

    // Add a newline between header and body to be safe, though header ends with newline logic
    // We want to ensure proper spacing.
    // header.txt ends with "  }, [userProfile]);" (no newline?)
    // body starts with "  const loadDashboardData..."

    // We'll add two newlines to separate the useEffect from the function def.
    const newContent = headerContent + "\n\n" + body;

    fs.writeFileSync(dashboardPath, newContent);
    console.log('Fixed Dashboard.jsx successfully.');
} catch (e) {
    console.error('Error fixing file:', e);
    process.exit(1);
}
