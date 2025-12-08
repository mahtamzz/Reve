const nodemailer = require("nodemailer");
const env = require("../../config/env");

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: env.EMAIL_USER,
                pass: env.EMAIL_PASS,
            },
        });
    }

    async send(to, subject, text) {
        await this.transporter.sendMail({
            from: env.EMAIL_USER,
            to,
            subject,
            text,
        });
    }
}

module.exports = new EmailService();
