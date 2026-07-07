const prisma = require('../prismaClient');

// The central ledger engine
class TransactionService {
  async recordInvoice(invoiceId, customerId, amount, date, memo) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    const newBal = customer.currentBalance + amount; // Invoice increases balance owed

    await prisma.transaction.create({
      data: {
        date: new Date(date),
        customerId,
        type: 'Invoice',
        reference: `INV-${invoiceId}`,
        description: memo,
        debit: amount,
        credit: 0,
        runningBalance: newBal,
        invoiceId
      }
    });

    await prisma.customer.update({
      where: { id: customerId },
      data: { currentBalance: newBal }
    });
  }

  async recordPayment(paymentId, customerId, invoiceId, amount, date, memo) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    const newBal = customer.currentBalance - amount; // Payment decreases balance owed

    await prisma.transaction.create({
      data: {
        date: new Date(date),
        customerId,
        type: 'Payment',
        reference: `PAY-${paymentId}`,
        description: memo,
        debit: 0,
        credit: amount,
        runningBalance: newBal,
        paymentId,
        invoiceId
      }
    });

    await prisma.customer.update({
      where: { id: customerId },
      data: { currentBalance: newBal }
    });

    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (invoice) {
        const newRemaining = invoice.remainingBalance - amount;
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            remainingBalance: newRemaining,
            status: newRemaining <= 0 ? 'Closed' : 'Partial'
          }
        });
      }
    }
  }

  async recordReturn(returnId, customerId, invoiceId, amount, date, memo) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    const newBal = customer.currentBalance - amount; // Return decreases balance owed

    await prisma.transaction.create({
      data: {
        date: new Date(date),
        customerId,
        type: 'Return',
        reference: `RET-${returnId}`,
        description: memo,
        debit: 0,
        credit: amount,
        runningBalance: newBal,
        returnId,
        invoiceId
      }
    });

    await prisma.customer.update({
      where: { id: customerId },
      data: { currentBalance: newBal }
    });

    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (invoice) {
        const newRemaining = invoice.remainingBalance - amount;
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            remainingBalance: newRemaining,
            status: newRemaining <= 0 ? 'Closed' : 'Partial'
          }
        });
      }
    }
  }

  async recordDiscount(discountId, customerId, invoiceId, amount, date, memo) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    const newBal = customer.currentBalance - amount; // Discount decreases balance owed

    await prisma.transaction.create({
      data: {
        date: new Date(date),
        customerId,
        type: 'Discount',
        reference: `DISC-${discountId}`,
        description: memo,
        debit: 0,
        credit: amount,
        runningBalance: newBal,
        discountId,
        invoiceId
      }
    });

    await prisma.customer.update({
      where: { id: customerId },
      data: { currentBalance: newBal }
    });
  }
}

module.exports = new TransactionService();
