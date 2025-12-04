const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendOTPEmail(to, otp) {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: "Your Verification Code",
        text: `Your verification code is: ${otp}. It expires in 10 minutes.`
    });
}

module.exports = sendOTPEmail;
