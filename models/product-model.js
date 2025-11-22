const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    category: { type: String, required: true, trim: true },
    unitOfMeasure: { type: String, required: true, trim: true },

    // NEW: Track stock per warehouse
    stockByLocation: [{
        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'warehouse'
        },
        quantity: { type: Number, default: 0 }
    }],

    // We keep this as a calculated total for easy display on dashboards
    totalStock: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('product', productSchema);