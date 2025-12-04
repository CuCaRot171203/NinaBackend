const express = require('express');
const router = express.Router();
const { sendDailyProductEmail } = require('../services/emailScheduler');

router.post('/send-daily-email', async (req, res) => {
    try {
        await sendDailyProductEmail();
        res.json({ message: "Email đã được gửi (nếu có người nhận). Kiểm tra logs & inbox." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi khi gửi mail", error: err.message });
    }
});

module.exports = router;