const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.locals.io = io; // Attach io to app so controllers can access it via req.app.locals.io
global.io = io;     // Attach to global so Prisma middleware can broadcast DB updates

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const importRoutes = require('./routes/importRoutes');
const customerRoutes = require('./routes/customerRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const hrRoutes = require('./routes/hrRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const systemController = require('./controllers/systemController');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/import', importRoutes);
// app.use('/api/transactions', transactionRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Database stats route
app.post('/api/system/discount', systemController.enterDiscount);
app.post('/api/system/pdf', systemController.generatePDF);
app.post('/api/system/excel', systemController.exportExcel);

app.get('/health', systemController.getHealth);

// Serve Frontend Static Files
const path = require('path');
// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all route to serve React index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
