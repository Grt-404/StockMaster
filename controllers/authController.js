const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/generateToken');


module.exports.registerUser = async function (req, res) {
    try {

        const { email, fullname, password, LoginID } = req.body;
        let user = await userModel.findOne({ email });
        if (user) {
            req.flash("error", "You already have an account, please login");
            return res.redirect("/");

        }
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const createdUser = await userModel.create({
            email,
            password: hash,
            fullname,
            LoginID
        });

        const token = generateToken(createdUser);
        res.cookie("token", token);
        res.status(201).redirect('/home');

    } catch (err) {
        console.error(err.message);
        req.flash("error", "Server Error");
        return res.redirect("/");

    }
};
module.exports.loginUser = async function (req, res) {
    let { LoginID, password } = req.body;
    let user = await userModel.findOne({ LoginID });
    if (!user) {
        req.flash("error", "LoginID is incorrect");
        return res.redirect("/");

    }
    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            let token = generateToken(user);
            res.cookie("token", token);
            res.redirect('/home');
        }
        else {

            req.flash("error", "LoginID or password is incorrect");
            return res.redirect("/");


        }
    })
}
module.exports.logout = async function (req, res) {
    res.cookie("token", "");
    res.redirect('/')
}
module.exports.forgotPassword = async function (req, res) {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            req.flash("error", "User with this email does not exist.");
            return res.redirect("/forgot-password");
        }

        // Create a temporary token valid for 15 minutes
        const secret = process.env.EXPRESS_SESSION_SECRET + user.password; // Valid only until password changes
        const token = jwt.sign({ email: user.email, id: user._id }, secret, { expiresIn: "15m" });

        const link = `http://localhost:3000/reset-password/${user._id}/${token}`;

        await sendEmail(email, "Password Reset - StockMaster", `Click this link to reset your password: ${link}`);

        req.flash("success", "Password reset link sent to your email.");
        res.redirect("/login");

    } catch (err) {
        console.log(err);
        req.flash("error", "Something went wrong.");
        res.redirect("/forgot-password");
    }
};

module.exports.resetPasswordGet = async function (req, res) {
    const { id, token } = req.params;
    const user = await userModel.findById(id);

    if (!user) {
        req.flash("error", "Invalid link.");
        return res.redirect("/login");
    }

    try {
        const secret = process.env.EXPRESS_SESSION_SECRET + user.password;
        jwt.verify(token, secret);
        res.render("reset-password", { email: user.email, id, token }); // Render the form
    } catch (err) {
        req.flash("error", "Link expired or invalid.");
        res.redirect("/login");
    }
};

module.exports.resetPasswordPost = async function (req, res) {
    const { id, token } = req.params;
    const { password } = req.body;

    const user = await userModel.findById(id);
    if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/login");
    }

    try {
        // Verify token again before changing password
        const secret = process.env.EXPRESS_SESSION_SECRET + user.password;
        jwt.verify(token, secret);

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Update user
        user.password = hash;
        await user.save();

        req.flash("success", "Password reset successful! Please login.");
        res.redirect("/login");
    } catch (err) {
        req.flash("error", "Something went wrong.");
        res.redirect("/login");
    }
};
