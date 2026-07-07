const xlsx = require('xlsx');
const transactionService = require('../services/transactionService');
const prisma = require('../prismaClient');

exports.importCustomers = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let imported = 0, skipped = 0;
    
    for (const row of data) {
      const id = row['Customer ID'];
      const name = row['Customer Name'];
      if (!id || !name) {
        skipped++;
        continue;
      }
      
      const existing = await prisma.customer.findUnique({ where: { customerNumber: id.toString() } });
      if (existing) {
        skipped++;
        continue;
      }

      await prisma.customer.create({
        data: {
          customerNumber: id.toString(),
          name: name,
          phone: row['Phone']?.toString() || '',
          address: row['Address']?.toString() || '',
          openingBalance: parseFloat(row['Opening Balance'] || 0),
          currentBalance: parseFloat(row['Opening Balance'] || 0),
          creditLimit: parseFloat(row['Credit Limit'] || 0)
        }
      });
      imported++;
    }

    await prisma.importLog.create({
      data: { type: 'Customers', filename: req.file.originalname, status: 'Success', imported, skipped }
    });

    res.json({ message: 'Import complete', imported, skipped });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process file', details: error.message });
  }
};

exports.importInvoices = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    // Grouping by Num
    const groups = {};
    for (const row of data) {
      const num = row['Num']?.toString().trim() || row['NUM']?.toString().trim();
      if (!num) continue;

      if (!groups[num]) {
        groups[num] = {
          type: row['Type']?.toString().trim().toLowerCase() === 'credit memo' ? 'return' : 'invoice',
          date: row['Date'] || row['DATE'],
          customerName: row['Name']?.toString().trim() || row['CUSTOMER NAME']?.toString().trim(),
          amount: 0,
          memo: row['Item Description']?.toString() || row['MEMO']?.toString() || 'Imported transaction',
          items: []
        };
      }
      
      groups[num].items.push({
        itemCode: row['Item']?.toString() || '',
        itemDesc: row['Item Description']?.toString() || row['Description']?.toString() || '',
        qty: parseFloat(row['Qty'] || row['Quantity'] || 1),
        price: parseFloat(row['Sales Price'] || row['Price'] || row['Amount'] || 0),
        amount: parseFloat(row['Amount'] || 0)
      });
      
      groups[num].amount += parseFloat(row['Amount'] || row['AMOUNT'] || 0);
    }

    let importedInvoices = 0, importedReturns = 0, skipped = 0;

    for (const num of Object.keys(groups)) {
      const group = groups[num];
      if (!group.customerName || isNaN(group.amount)) { skipped++; continue; }

      // Convert date
      let dateObj;
      if (typeof group.date === 'number') {
        dateObj = new Date((group.date - 25569) * 86400 * 1000);
      } else {
        dateObj = new Date(group.date);
        if (isNaN(dateObj)) dateObj = new Date();
      }

      // Try exact match first
      let customer = await prisma.customer.findFirst({ where: { name: group.customerName } });
      
      // If not found, try without trailing dot
      if (!customer) {
        const cleanName = group.customerName.replace(/\.+$/, '').trim();
        customer = await prisma.customer.findFirst({ where: { name: { startsWith: cleanName } } });
      }
      
      if (!customer) { skipped++; continue; } // Customer must exist

      if (group.type === 'invoice') {
        const existingInvoice = await prisma.invoice.findUnique({ where: { invoiceNumber: num } });
        if (existingInvoice) { 
            // Update lineItems if it already exists
            await prisma.invoice.update({
                where: { invoiceNumber: num },
                data: { lineItems: JSON.stringify(group.items) }
            });
            importedInvoices++;
            continue; 
        }

        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber: num,
            date: dateObj,
            customerId: customer.id,
            amount: group.amount,
            remainingBalance: group.amount,
            memo: group.memo,
            lineItems: JSON.stringify(group.items)
          }
        });
        
        // Pass num as memo so it's recorded correctly? Wait, transactionService uses invoice.id. Let's just fix the transaction service reference directly next.
        await transactionService.recordInvoice(invoice.id, customer.id, group.amount, dateObj, group.memo);
        
        // Update the transaction reference to be the actual invoice number!
        await prisma.transaction.updateMany({
          where: { invoiceId: invoice.id },
          data: { reference: num }
        });
        
        importedInvoices++;
      } else {
        // Return / Credit Memo
        const existingReturn = await prisma.return.findUnique({ where: { returnNumber: num } });
        if (existingReturn) { 
            // Update lineItems if it already exists
            await prisma.return.update({
                where: { returnNumber: num },
                data: { lineItems: JSON.stringify(group.items) }
            });
            importedReturns++;
            continue; 
        }

        const ret = await prisma.return.create({
          data: {
            returnNumber: num,
            date: dateObj,
            customerId: customer.id,
            amount: group.amount,
            memo: group.memo,
            lineItems: JSON.stringify(group.items)
          }
        });
        
        await transactionService.recordReturn(ret.id, customer.id, null, group.amount, dateObj, group.memo);
        
        // Update the transaction reference to be the actual return number!
        await prisma.transaction.updateMany({
          where: { returnId: ret.id },
          data: { reference: num }
        });
        
        importedReturns++;
      }
    }

    await prisma.importLog.create({
      data: { type: 'Invoices/Returns', filename: req.file.originalname, status: 'Success', imported: importedInvoices + importedReturns, skipped }
    });

    res.json({ message: 'Import complete', importedInvoices, importedReturns, skipped });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process file', details: error.message });
  }
};

exports.importPayments = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let imported = 0, skipped = 0;

    for (const row of data) {
      const num = row['PAYMENT NO']?.toString();
      const customerName = row['CUSTOMER NAME']?.toString();
      const invoiceNum = row['INVOICE NO']?.toString();
      const amount = parseFloat(row['AMOUNT'] || 0);
      const date = new Date(row['DATE']);

      if (!num || !customerName || isNaN(amount)) { skipped++; continue; }

      const existingPayment = await prisma.payment.findUnique({ where: { paymentNumber: num } });
      if (existingPayment) { skipped++; continue; }

      let customer = await prisma.customer.findFirst({ where: { name: customerName } });
      if (!customer) { skipped++; continue; }

      let invoice = null;
      if (invoiceNum) {
        invoice = await prisma.invoice.findUnique({ where: { invoiceNumber: invoiceNum } });
      }

      const payment = await prisma.payment.create({
        data: {
          paymentNumber: num,
          date: date,
          customerId: customer.id,
          invoiceId: invoice ? invoice.id : null,
          amount: amount,
          memo: row['MEMO']?.toString() || ''
        }
      });
      
      await transactionService.recordPayment(payment.id, customer.id, invoice ? invoice.id : null, amount, date, row['MEMO']?.toString());
      imported++;
    }

    await prisma.importLog.create({
      data: { type: 'Payments', filename: req.file.originalname, status: 'Success', imported, skipped }
    });

    res.json({ message: 'Import complete', imported, skipped });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process file', details: error.message });
  }
};
