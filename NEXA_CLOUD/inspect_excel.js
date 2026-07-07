const xlsx = require('xlsx');

const filePath = 'C:\\Users\\Enter Computer\\Downloads\\ياسر محمد محمود 10103109.xlsx';
const workbook = xlsx.readFile(filePath);
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

console.log(JSON.stringify(data.slice(0, 10), null, 2));
