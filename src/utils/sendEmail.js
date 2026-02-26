import nodemailer from "nodemailer";

/**
 * Send an email using Gmail service
 * @param {{ to: string, subject: string, html: string }} options
 */
const sendEmail = async ({ to, subject, html }) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        // Force IPv4 — fixes ENETUNREACH on networks without IPv6
        family: 4,
    });

    const mailOptions = {
        from: `"Datara" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
    };

    await transporter.sendMail(mailOptions);
};

export default sendEmail;
