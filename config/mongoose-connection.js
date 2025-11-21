const mongoose = require('mongoose');
const config = require('config'); // Or use process.env directly if not using 'config' package
const dbgr = require('debug')("development:mongoose");

// 1. Load environment variables if not already loaded in app.js
// require('dotenv').config(); 

// 2. Connect using the environment variable
mongoose
    .connect(`${process.env.MONGODB_URI}/scatch`) // Ensure '/scatch' or your DB name is appended
    .then(function () {
        dbgr("connected");
        console.log("connected to MongoDB"); // Explicit console log for debugging
    })
    .catch(function (err) {
        dbgr(err);
        console.error("MongoDB connection error:", err); // Log the actual error
    });

module.exports = mongoose.connection;