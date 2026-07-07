const ZKLib = require('zklib-js');
const XLSX = require('xlsx');
const path = require('path');
const os = require('os');

const devices = [
  { name: 'ACC', ip: '192.168.1.180', port: 4370 },
  { name: '2', ip: '192.168.1.182', port: 4370 }
];

async function pullUsers() {
  const allUsers = [];

  for (const device of devices) {
    console.log(`Connecting to ${device.name} (${device.ip})...`);
    let zkInstance = new ZKLib(device.ip, device.port, 5200, 5000);
    
    try {
      await zkInstance.createSocket();
      
      const users = await zkInstance.getUsers();
      console.log(`Found ${users.data.length} users on ${device.name}`);
      
      users.data.forEach(u => {
        allUsers.push({
          'Device Name': device.name,
          'Device IP': device.ip,
          'System UID': u.uid,
          'Fingerprint User ID': u.userId,
          'Name on Device': u.name || '',
          'Role': u.role
        });
      });
      
      await zkInstance.disconnect();
    } catch (e) {
      console.error(`Failed to connect or pull from ${device.name}:`, e.message);
    }
  }

  if (allUsers.length > 0) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(allUsers);
    XLSX.utils.book_append_sheet(wb, ws, 'Device Users');
    
    const desktopPath = path.join(os.homedir(), 'Desktop', 'ZKTeco_Users_Map.xlsx');
    XLSX.writeFile(wb, desktopPath);
    console.log(`\nSuccess! Excel file saved to: ${desktopPath}`);
  } else {
    console.log('\nNo users found or failed to connect to devices.');
  }
}

pullUsers();
