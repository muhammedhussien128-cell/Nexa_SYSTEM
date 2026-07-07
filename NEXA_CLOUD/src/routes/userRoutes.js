const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { adminMiddleware } = require('../middlewares/authMiddleware');

router.get('/', adminMiddleware, userController.getAllUsers);
router.post('/', adminMiddleware, userController.createUser);
router.put('/:id', adminMiddleware, userController.updateUser);
router.delete('/:id', adminMiddleware, userController.deleteUser);

module.exports = router;
