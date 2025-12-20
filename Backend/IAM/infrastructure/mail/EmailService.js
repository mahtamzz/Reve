const nodemailer = require("nodemailer");

class EmailService {
    constructor({ user, pass, service = "gmail" }) {
        this.transporter = nodemailer.createTransport({
            service,
            auth: { user, pass },
            connectionTimeout: 10_000,
            greetingTimeout: 10_000,
            socketTimeout: 10_000
        });
    }

    async send(to, subject, text) {
        console.log("📧 Sending email to:", to);

        const info = await this.transporter.sendMail({
            from: this.transporter.options.auth.user,
            to,
            subject,
            text
        });

        console.log("✅ Email sent:", info.messageId);
    }
}

module.exports = EmailService;
