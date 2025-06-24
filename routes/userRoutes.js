const express = require('express');
const { registerUser, loginUser, getAllUsers, updateUser, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/', getAllUsers);
router.put('/:id', updateUser);
router.put('/change-password', protect, changePassword);

// Route được bảo vệ bằng token
router.get('/', protect, (req, res) => {
  res.json({ message: 'Bạn đã login rồi, chào ' + req.user.name });
});

module.exports = router;
