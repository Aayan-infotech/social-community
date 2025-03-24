import fs from "fs";
import path from "path";


// get the current directory
const __dirname = path.resolve();

// 


const getOtpTemplate = (otp) => otpTemplate.replace("{{OTP}}", otp);

export { getOtpTemplate };
