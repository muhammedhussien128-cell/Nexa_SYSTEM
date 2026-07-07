const prisma = require('../prismaClient');

// Get attendance for a specific date
exports.getDailyAttendance = async (req, res) => {
  try {
    const { date } = req.query; // Expecting YYYY-MM-DD
    const searchDate = date ? new Date(date) : new Date();
    searchDate.setHours(0, 0, 0, 0);

    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: searchDate,
          lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: { employee: true }
    });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Record or update attendance
exports.recordAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut } = req.body;
    
    // Parse date and reset time to 00:00:00 for the record day
    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0);

    // Check if record exists for this employee on this date
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
        data: {
          status,
          checkIn: checkIn ? new Date(checkIn) : existing.checkIn,
          checkOut: checkOut ? new Date(checkOut) : existing.checkOut
        }
      });
    } else {
      result = await prisma.attendance.create({
        data: {
          employeeId,
          date: recordDate,
          status,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null
        }
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get monthly report for all employees or specific employee
exports.getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query; // 1-12
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      include: { employee: true }
    });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
