const axios = require('axios');
const fs = require('fs');

async function runDemo() {
  console.log("=== STARTING NEXA E2E DEMO ===");
  try {
    // 1. Check health
    console.log("[1] Checking Backend Health...");
    const health = await axios.get('http://localhost:5000/health');
    console.log("Backend Status:", health.data.status, "-", health.data.message);

    // 2. Fetch Customers to simulate looking at customer list
    console.log("[2] Fetching Customers...");
    const customers = await axios.get('http://localhost:5000/api/customers');
    console.log(`Found ${customers.data.length} customers.`);

    // 3. Enter Discount
    console.log("[3] Entering Manual Discount...");
    const discountRes = await axios.post('http://localhost:5000/api/system/discount', { amount: 50 });
    console.log(discountRes.data.message);

    // 4. Generate PDF
    console.log("[4] Generating Statement PDF...");
    const pdfRes = await axios.post('http://localhost:5000/api/system/pdf', { customerId: 'TEST-123' });
    console.log(pdfRes.data.message, "at", pdfRes.data.fileUrl);

    // 5. Generate Excel
    console.log("[5] Generating Statement Excel...");
    const excelRes = await axios.post('http://localhost:5000/api/system/excel', { customerId: 'TEST-123' });
    console.log(excelRes.data.message, "at", excelRes.data.fileUrl);

    console.log("=== E2E DEMO COMPLETED SUCCESSFULLY ===");
  } catch (error) {
    console.error("❌ E2E DEMO ERROR:");
    console.error(error.message);
    if (error.response) console.error(error.response.data);
  }
}

runDemo();
