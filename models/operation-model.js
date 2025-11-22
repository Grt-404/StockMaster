const mongoose = require('mongoose');

const operationSchema = mongoose.Schema({
    // Identify if this is a Receipt (IN), Delivery (OUT), or Transfer (INT)
    type: {
        type: String,
        enum: ['Receipt', 'Delivery', 'Transfer', 'Adjustment'],
        required: true
    },
    // Unique ID like "WH/IN/001"
    reference: {
        type: String,
        unique: true,
        required: true
    },
    // Current state of the operation
    status: {
        type: String,
        enum: ['Draft', 'Waiting', 'Ready', 'Done', 'Cancelled'],
        default: 'Draft'
    },
    // The "Partner": Supplier (for Receipts) or Customer (for Deliveries)
    partner: {
        type: String,
        trim: true
    },
    // The list of products moving in this operation
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product', // Links to your product-model.js
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    // Optional: To track where stock is coming from/going to
    sourceLocation: { type: String, default: 'Vendor' },
    destinationLocation: { type: String, default: 'Warehouse' }
}, { timestamps: true });

module.exports = mongoose.model('operation', operationSchema);