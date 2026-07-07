const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController');

router.get('/data', hrController.getHRData);
router.post('/employees/create', hrController.createEmployee);
router.put('/employees/:id', hrController.updateEmployee);
router.post('/attendance/record', hrController.recordAttendance);
router.post('/advances/create', hrController.addAdvance);

module.exports = router;
