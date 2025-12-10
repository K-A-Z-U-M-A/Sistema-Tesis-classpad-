// Simple test for audit route
const testAudit = async () => {
    try {
        const response = await fetch('http://localhost:3001/api/audit?page=1&limit=25', {
            headers: {
                'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
            }
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
};

testAudit();
