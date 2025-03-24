import { Router } from "express";
import {
  signup,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyOtp,
  resendOTP,
  setPassword,
  logoutUser,
  changePassword,
  refreshAccessToken
} from "../controllers/auth.controller.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  loginValidationSchema,
  userValidationSchema,
  setPasswordValidationSchema,
  changePasswordSchema
} from "../validators/userValidator.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/signup").post(validateRequest(userValidationSchema), signup);
router.route("/login").post(validateRequest(loginValidationSchema), loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", verifyJWT, resetPassword);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOTP);
router.post("/set-password",validateRequest(setPasswordValidationSchema),setPassword);
router.post("/logout",verifyJWT,logoutUser);
router.post("/change-password",verifyJWT,validateRequest(changePasswordSchema),changePassword);
router.get("/refresh-token",refreshAccessToken);

export default router;
