import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken =  process.env.TWILIO_AUTH_TOKEN;
const serviceId =  process.env.TWILIO_SERVICE_SID;

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