const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        vi: { type: String, required: true },
        en: { type: String, required: true },
    },
    price: { type: mongoose.Schema.Types.Mixed, required: true },
    salePrice: { type: mongoose.Schema.Types.Mixed },
    sold: { type: Number, default: 0 },
    rated: { type: Number, default: 0 },
    productImageUrl: { type: String },
    subcription: {
        vi: { type: String },
        en: { type: String }
    },
    description: {
        vi: { type: String },
        en: { type: String }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    }
});

module.exports = mongoose.model('Product', productSchema);