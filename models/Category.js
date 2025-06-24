const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        vi: { type: String, required: true },
        en: { type: String, required: true }
    },
})

module.exports = mongoose.model('Category', categorySchema);