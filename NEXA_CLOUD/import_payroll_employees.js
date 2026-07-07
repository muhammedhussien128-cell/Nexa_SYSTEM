const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const prisma = new PrismaClient();

const filePath = 'D:\\Payroll  july2026.xlsm';
const employeeSheetName = 'Employees';

function excelTimeToString(excelTime) {
  if (typeof excelTime !== 'number') return excelTime;
  const totalMinutes = Math.round(excelTime * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

async function main() {
  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets[employeeSheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Data starts at index 3 (4th row)
  const rows = data.slice(3);
  let count = 0;
  
  for (const row of rows) {
    if (!row || row.length === 0 || !row[0]) continue;
    
    const employeeId = row[0]?.toString().trim();
    const name = row[1]?.toString().trim();
    const position = row[2]?.toString().trim() || '';
    const basicSalary = parseFloat(row[3]) || 0;
    
    // Sometimes Excel parses time as string, sometimes as number
    const expectedCheckIn = excelTimeToString(row[6]) || '09:00';
    const expectedCheckOut = excelTimeToString(row[7]) || '17:00';
    
    if (!name) continue;
    
    // Check if employee exists
    const existing = await prisma.employee.findUnique({
      where: { employeeId: employeeId }
    });
    
    if (existing) {
      await prisma.employee.update({
        where: { id: existing.id },
        data: { name, position, basicSalary, expectedCheckIn, expectedCheckOut }
      });
      console.log(`Updated: ${name}`);
    } else {
      await prisma.employee.create({
        data: { employeeId, name, position, basicSalary, expectedCheckIn, expectedCheckOut }
      });
      console.log(`Created: ${name}`);
    }
    count++;
  }
  
  console.log(`\nImport complete. Processed ${count} employees.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
