const express = require('express');
const router = express.Router();
const multer = require('multer');
const importController = require('../controllers/importController');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.post('/customers', upload.single('file'), importController.importCustomers);
router.post('/invoices', upload.single('file'), importController.importInvoices);
router.post('/payments', upload.single('file'), importController.importPayments);

module.exports = router;
