const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function importOdooCustomers() {
  console.log("Starting Odoo Customers Import...");
  try {
    const wb = xlsx.readFile('D:/Dataset for odoo/Customers/Customes Contant 2026.xlsx');
    const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    
    let imported = 0;
    let skipped = 0;

    for (const row of data) {
      const name = row['Customer'];
      const customerNumber = row['Account No.'] || `CUST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const phone = row['Phone'] ? row['Phone'].toString() : null;
      const address = row['Ship to 1'] ? row['Ship to 1'].toString() : null;
      // In Odoo exports sometimes negative balance means money owed to us or vice versa, but we'll import exactly as is.
      const openingBalance = parseFloat(row['Balance'] || 0);

      if (!name) {
        skipped++;
        continue;
      }

      const existing = await prisma.customer.findUnique({ where: { customerNumber } });
      if (existing) {
        skipped++;
        continue;
      }

      await prisma.customer.create({
        data: {
          customerNumber,
          name,
          phone,
          address,
          openingBalance,
          currentBalance: openingBalance
        }
      });
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`Imported ${imported} customers so far...`);
      }
    }
    
    console.log(`✅ Import Complete! Successfully added ${imported} customers. Skipped ${skipped}.`);
  } catch (error) {
    console.error("❌ Error importing customers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importOdooCustomers();
