const mongoose = require('mongoose');


const userSchema = mongoose.Schema({
    fullname: String,
    email: String,
    // ADD THIS FIELD
    password: {
        type: String,
        required: true // Passwords should be required for authentication
    },
    cart: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            quantity: {
                type: Number,
                default: 1
            }
        }
    ],

    orders: {
        type: Array,
        default: []
    },
    contact: Number,
    image: {
        type: String, // Simpler placeholder type
        default: "" // Ensure a default value if you keep the field
    }

})
module.exports = mongoose.model("user", userSchema);