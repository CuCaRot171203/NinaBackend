const mongoose = require('mongoose');

const subcribeSchema = new mongoose.Schema({
    subscribeEmail: {
        type: String,
        required: true,
        // unique: true,
        lowercase: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Subcribe', subcribeSchema);