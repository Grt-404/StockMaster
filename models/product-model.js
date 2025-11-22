const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true // Standardization for SKU codes
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    unitOfMeasure: {
        type: String,
        required: true,
        trim: true
        // You can add an enum here later if you want strict types: 
        // enum: ['kg', 'liter', 'unit', 'meter'] 
    },
    stock: {
        type: Number,
        default: 0 // Covers the "Initial stock" requirement
    }
}, { timestamps: true });

module.exports = mongoose.model('product', productSchema);