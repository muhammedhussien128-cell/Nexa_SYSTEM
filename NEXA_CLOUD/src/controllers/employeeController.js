const prisma = require('../prismaClient');

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { employeeId, name, department, position } = req.body;
    const employee = await prisma.employee.create({
      data: { employeeId, name, department, position }
    });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.attendance.deleteMany({ where: { employeeId: id } });
    await prisma.employee.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
