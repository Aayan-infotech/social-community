import nodemailer from "nodemailer";
import { loadConfig } from "../config/loadConfig.js";
const config = await loadConfig();

const transporter = nodemailer.createTransport({
    // host: "sandbox.smtp.mailtrap.io",
    service: "gmail",
    port: 2525,
    auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
    },
});


export const sendEmail = async (to, subject, html, attachments = []) => {
    try {
        await transporter.sendMail({
            from: `"MyApp Support" <${config.EMAIL_USER}>`,
            to,
            subject,
            html,
            attachments
        });
        return { success: true };
    } catch (err) {
        return { success: false, message: "Failed to send email" };
    }
};
