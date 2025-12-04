const express = require('express');
const router = express.Router();
const { sendDailyProductEmail } = require('../services/emailScheduler');
router.post('/send-daily-test', async (req, res) => {
    try {
        await sendDailyProductEmail();
        res.json({ message: 'Triggered sendDailyProductEmail (check logs/inbox).' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
