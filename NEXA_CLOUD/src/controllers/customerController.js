const prisma = require('../prismaClient');

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCustomerStatement = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const transactions = await prisma.transaction.findMany({
      where: { customerId: id },
      orderBy: { date: 'asc' }
    });

    const invoices = await prisma.invoice.findMany({ where: { customerId: id } });
    const returns = await prisma.return.findMany({ where: { customerId: id } });

    res.json({ customer, transactions, invoices, returns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
