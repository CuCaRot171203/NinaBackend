const mongoose = require('mongoose');

const dailyEmailHistorySchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DailyEmailHistory', dailyEmailHistorySchema);