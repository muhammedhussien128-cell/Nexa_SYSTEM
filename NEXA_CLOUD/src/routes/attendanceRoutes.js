const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.get('/daily', attendanceController.getDailyAttendance);
router.post('/record', attendanceController.recordAttendance);
router.get('/report', attendanceController.getMonthlyReport);

module.exports = router;
