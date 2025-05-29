import twilio from 'twilio';
import { loadConfig } from '../config/loadConfig.js';

const secret = await loadConfig();

const accountSid = secret.TWILIO_ACCOUNT_SID;
const authToken =  secret.TWILIO_AUTH_TOKEN;
const serviceId =  secret.TWILIO_SERVICE_SID;

const client = twilio(accountSid, authToken);

const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

const sendOTP = async (mobile, otp) => {
    try {
        await client.messages.create({
            body: `Your verification code is ${otp}. It will expire in 10 minutes.`,
            messagingServiceSid: serviceId,
            to: mobile,
        });
        return { success: true };
    } catch (error) {
        return { success: false, message: [error.message] };
    }
};

export {
    generateOTP,
    sendOTP
}