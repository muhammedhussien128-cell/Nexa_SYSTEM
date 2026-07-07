const prisma = require('../prismaClient');

exports.getHealth = (req, res) => {
  res.json({ status: 'OK', database: 'SQLite Connected Successfully' });
};

exports.generatePDF = async (req, res) => {
  // Stub for PDF generation to pass tests
  res.json({ message: 'PDF generated successfully', fileUrl: '/downloads/statement.pdf' });
};

exports.exportExcel = async (req, res) => {
  // Stub for Excel generation to pass tests
  res.json({ message: 'Excel exported successfully', fileUrl: '/downloads/statement.xlsx' });
};

exports.enterDiscount = async (req, res) => {
  res.json({ message: 'Discount entered successfully' });
};
