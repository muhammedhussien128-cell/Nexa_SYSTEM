const ZKLib = require('zklib-js');

class ZKService {
  /**
   * Connect to a ZKTeco device
   */
  static async connectToDevice(ip, port = 4370) {
    const zkInstance = new ZKLib(ip, port, 10000, 4000); // 10s timeout
    try {
      await zkInstance.createSocket();
    } catch (e) {
      console.log(`Failed to create socket for ${ip}:${port}: `, e);
      throw new Error(`Connection timeout to device ${ip}`);
    }
    return zkInstance;
  }

  /**
   * Fetch all users from the machine
   */
  static async getUsers(ip, port = 4370) {
    let zkInstance;
    try {
      zkInstance = await this.connectToDevice(ip, port);
      const users = await zkInstance.getUsers();
      await zkInstance.disconnect();
      return users.data || [];
    } catch (error) {
      if (zkInstance) await zkInstance.disconnect();
      console.error(`Error getting users from ${ip}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all attendance logs from the machine
   */
  static async getAttendances(ip, port = 4370) {
    let zkInstance;
    try {
      zkInstance = await this.connectToDevice(ip, port);
      const logs = await zkInstance.getAttendances();
      await zkInstance.disconnect();
      return logs.data || [];
    } catch (error) {
      if (zkInstance) await zkInstance.disconnect();
      console.error(`Error getting attendances from ${ip}:`, error);
      throw error;
    }
  }

  /**
   * Set the time of the device (useful for DST)
   */
  static async setTime(ip, port = 4370, timeDate = new Date()) {
    let zkInstance;
    try {
      zkInstance = await this.connectToDevice(ip, port);
      await zkInstance.setTime(timeDate);
      await zkInstance.disconnect();
      return true;
    } catch (error) {
      if (zkInstance) await zkInstance.disconnect();
      console.error(`Error setting time on ${ip}:`, error);
      throw error;
    }
  }
}

module.exports = ZKService;
