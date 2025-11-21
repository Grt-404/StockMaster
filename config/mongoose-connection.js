const mongoose = require('mongoose');
// const config = require('config'); // <-- Do not use the 'config' module here unless necessary
const dbgr = require("debug")("development:mongoose")

// Use the MONGODB_URI directly from environment variables (loaded by dotenv in app.js)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    dbgr("FATAL ERROR: MONGODB_URI is not defined in environment variables. Please check your .env file.");
} else {
    // Attempt to connect using the URI and the hardcoded database name 'ODOO'
    mongoose
        // Use the connection string + database name (as per original logic)
        .connect(`${MONGODB_URI}/ODOO`, {
            // Include modern options to ensure stable connection
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 15000, // Increase timeout slightly for debugging
            socketTimeoutMS: 45000,
        })
        .then(function () {
            dbgr("CONNECTED: Successfully connected to MongoDB.");
        })
        .catch(function (err) {
            // This catches connection failures after attempting to connect
            dbgr("CONNECTION ERROR:", err.message);
        })
}

module.exports = mongoose.connection;