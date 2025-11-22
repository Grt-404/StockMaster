const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail", // Or 'hotmail', 'yahoo', etc.
            auth: {
                user: "samparkapp25@gmail.com", // [EDIT]: Your Email
                pass: "quyu jboq blqa kjcs",    // [EDIT]: App Password (Not your login password)
            },
        });

        await transporter.sendMail({
            from: "StockMaster Admin <no-reply@stockmaster.app>",
            to: email,
            subject: subject,
            text: text,
        });

        console.log("Email sent successfully");
    } catch (error) {
        console.log("Email not sent");
        console.error(error);
        throw new Error("Email could not be sent"); // Throw to handle in controller
    }
};

module.exports = sendEmail;