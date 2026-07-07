const prisma = require('../prismaClient');

// Get all HR data for state synchronization
exports.getHRData = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        attendances: true,
        advances: true
      }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Employee with auto-increment ID
exports.createEmployee = async (req, res) => {
  try {
    const { name, department, position, basicSalary, expectedCheckIn, expectedCheckOut, exemptFromAttendance, exemptFromLate } = req.body;
    
    // Auto-generate employeeId
    const latestEmployee = await prisma.employee.findFirst({
      orderBy: { employeeId: 'desc' }
    });

    let newId = 'EMP-001';
    if (latestEmployee && latestEmployee.employeeId.startsWith('EMP-')) {
      const suffix = parseInt(latestEmployee.employeeId.split('-')[1]);
      if (!isNaN(suffix)) {
        newId = `EMP-${String(suffix + 1).padStart(3, '0')}`;
      }
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId: newId,
        name,
        department,
        position,
        basicSalary: parseFloat(basicSalary) || 0,
        expectedCheckIn,
        expectedCheckOut,
        exemptFromAttendance: Boolean(exemptFromAttendance),
        exemptFromLate: Boolean(exemptFromLate)
      },
      include: {
        attendances: true,
        advances: true
      }
    });

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position, basicSalary, expectedCheckIn, expectedCheckOut, linkedToId, exemptFromAttendance, exemptFromLate } = req.body;
    
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        position,
        basicSalary: parseFloat(basicSalary) || 0,
        expectedCheckIn,
        expectedCheckOut,
        linkedToId: linkedToId || null,
        exemptFromAttendance: exemptFromAttendance !== undefined ? Boolean(exemptFromAttendance) : undefined,
        exemptFromLate: exemptFromLate !== undefined ? Boolean(exemptFromLate) : undefined
      },
      include: {
        attendances: true,
        advances: true
      }
    });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.recordAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut } = req.body;
    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: recordDate,
          lt: new Date(recordDate.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    let result;
    if (existing) {
      result = await prisma.attendance.update({
        where: { id: existing.id },
        data: { status, checkIn, checkOut }
      });
    } else {
      result = await prisma.attendance.create({
        data: { employeeId, date: recordDate, status, checkIn, checkOut }
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addAdvance = async (req, res) => {
  try {
    const { employeeId, date, type, amount, reason } = req.body;
    const result = await prisma.advanceDeduction.create({
      data: {
        employeeId,
        date: new Date(date),
        type,
        amount: parseFloat(amount),
        reason
      }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
