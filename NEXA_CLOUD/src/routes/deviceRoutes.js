const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.get('/', deviceController.getDevices);
router.post('/add', deviceController.addDevice);
router.delete('/:id', deviceController.deleteDevice);
router.post('/test', deviceController.testConnection);
router.post('/sync-time', deviceController.syncTime);
router.post('/map-employee', deviceController.mapEmployee);
router.post('/sync-attendance', deviceController.syncAttendance);

module.exports = router;
