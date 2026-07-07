const prisma = require('../prismaClient');
const transactionService = require('../services/transactionService');

exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        date: 'desc'
      }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, memo, paymentNumber } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    }

    // Create the payment
    const paymentDate = new Date();
    const finalPaymentNumber = paymentNumber || `PAY-${Date.now()}`;

    const payment = await prisma.payment.create({
      data: {
        paymentNumber: finalPaymentNumber,
        date: paymentDate,
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        amount: parseFloat(amount),
        memo: memo || `Payment for Invoice ${invoice.invoiceNumber}`
      }
    });

    // Record the payment transaction to update the customer statement
    await transactionService.recordPayment(payment.id, invoice.customerId, invoice.id, parseFloat(amount), paymentDate, memo || `Payment for Invoice ${invoice.invoiceNumber}`);

    // Update invoice remaining balance
    const newRemainingBalance = invoice.remainingBalance - parseFloat(amount);
    let newStatus = 'Open';
    if (newRemainingBalance <= 0) {
      newStatus = 'Closed';
    } else if (newRemainingBalance < invoice.amount) {
      newStatus = 'Partial';
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        remainingBalance: newRemainingBalance,
        status: newStatus
      },
      include: { customer: true }
    });

    res.json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
