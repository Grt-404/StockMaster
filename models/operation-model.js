const mongoose = require('mongoose');

const operationSchema = mongoose.Schema({
    type: {
        type: String,
        enum: ['Receipt', 'Delivery', 'Transfer', 'Adjustment'],
        required: true
    },
    reference: { type: String, unique: true, required: true },
    status: {
        type: String,
        enum: ['Draft', 'Waiting', 'Ready', 'Done', 'Cancelled'],
        default: 'Draft'
    },
    partner: { type: String, trim: true },

    // NEW: Where is the stock coming FROM and going TO?
    sourceLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'warehouse'
    },
    destinationLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'warehouse'
    },

    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true
        },
        quantity: { type: Number, required: true, min: 1 }
    }]
}, { timestamps: true });

module.exports = mongoose.model('operation', operationSchema);