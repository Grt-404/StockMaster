const express = require("express");
const app = express();
require('dotenv').config();
const db = require('./config/mongoose-connection'); // Ensure this file exists and connects properly
const path = require("path");
const indexRouter = require("./routes/index");
const cookieParser = require('cookie-parser');
const flash = require("connect-flash");
const expressSession = require("express-session");
const usersRouter = require('./routes/usersRouter');
const productsRouter = require('./routes/productsRouter'); // Import the new router

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// 1. Session MUST be set up first
app.use(
    expressSession({
        resave: false,
        saveUninitialized: false,
        secret: process.env.EXPRESS_SESSION_SECRET || "secret", // Added fallback for safety
    })
);

// 2. Flash MUST be set up after session
app.use(flash());

// 3. Routes MUST be set up last (so they have access to flash)
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter); // <--- PLACE IT HERE, AFTER FLASH

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});