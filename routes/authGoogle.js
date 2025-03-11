import express from "express";
import passport from "passport";
import { logger } from "../utils/logger.js";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", (err, user, info) => {
      if (err) {
        logger.error(`Google login error: ${err.message}`);
        return res.status(500).json({
          status: 500,
          message: [`Google login failed: ${err.message}`]
        });
      }

      if (!user) {
        logger.warn("Google login failed: No user returned.");
        return res.status(404).json({
          status: 404,
          message: ["User not found with the provided email. Please check the details and try again."]
        });
      }

      const { accessToken, refreshToken } = user;

      logger.info(`Google login successful for user: ${user.user.email}`);
      return res.status(200).json({
        status: 200,
        message: ["Login successful"],
        data: { user: user.user, accessToken, refreshToken }
      });
    })(req, res, next);
  }
);

export default router;
