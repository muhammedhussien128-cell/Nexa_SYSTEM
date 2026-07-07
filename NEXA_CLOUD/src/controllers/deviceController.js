const prisma = require('../prismaClient');
const ZKService = require('../services/zkService');

// Get all devices
exports.getDevices = async (req, res) => {
  try {
    const devices = await prisma.biometricDevice.findMany();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a device
exports.addDevice = async (req, res) => {
  try {
    const { name, ipAddress, port } = req.body;
    const device = await prisma.biometricDevice.create({
      data: { name, ipAddress, port: port || 4370 }
    });
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a device
exports.deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.biometricDevice.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Test Connection
exports.testConnection = async (req, res) => {
  try {
    const { ipAddress, port } = req.body;
    // We just attempt to connect and get users to prove it works
    const users = await ZKService.getUsers(ipAddress, port);
    res.json({ success: true, message: `Connected! Found ${users.length} users.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Sync Time
exports.syncTime = async (req, res) => {
  try {
    const { ipAddress, port } = req.body;
    await ZKService.setTime(ipAddress, port, new Date());
    res.json({ success: true, message: 'Time synchronized to server time.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Map Employee (Set deviceUserId and/or linkedToId)
exports.mapEmployee = async (req, res) => {
  try {
    const { employeeId, deviceUserId, linkedToId } = req.body;
    
    let updateData = {};
    if (deviceUserId !== undefined) updateData.deviceUserId = deviceUserId;
    if (linkedToId !== undefined) updateData.linkedToId = linkedToId || null;

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Sync Attendance
exports.syncAttendance = async (req, res) => {
  try {
    const devices = await prisma.biometricDevice.findMany();
    const employees = await prisma.employee.findMany();
    let totalSynced = 0;

    for (const device of devices) {
      try {
        const logs = await ZKService.getAttendances(device.ipAddress, device.port);
        
        for (const log of logs) {
          // Log contains { deviceUserId, recordTime }
          const emp = employees.find(e => e.deviceUserId === String(log.deviceUserId));
          if (!emp) continue;

          const recordDate = new Date(log.recordTime);
          const dayStart = new Date(recordDate);
          dayStart.setHours(0,0,0,0);
          
          const existing = await prisma.attendance.findFirst({
            where: {
              employeeId: emp.id,
              date: {
                gte: dayStart,
                lt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
              }
            }
          });

          // A very simple logic: first punch = checkIn, last punch = checkOut
          if (!existing) {
            await prisma.attendance.create({
              data: {
                employeeId: emp.id,
                date: dayStart,
                status: 'Present',
                checkIn: recordDate
              }
            });
            totalSynced++;
          } else {
            // Update checkOut if recordTime is later than checkIn
            if (existing.checkIn && recordDate > existing.checkIn) {
              await prisma.attendance.update({
                where: { id: existing.id },
                data: { checkOut: recordDate }
              });
              totalSynced++;
            }
          }
        }
      } catch (deviceError) {
        console.error(`Failed to sync device ${device.name}:`, deviceError);
        // Continue to next device
      }
    }

    res.json({ success: true, message: `Synced ${totalSynced} punches from devices.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
