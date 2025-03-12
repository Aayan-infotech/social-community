import passport from "passport";
import jwt from "jsonwebtoken";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { generateUniqueUserId, genrateReferral } from '../utils/passwordUtils.js'
import UserModel from "../models/userModel.js"
import { loadConfig } from './loadConfig.js';
import { logger } from '../utils/logger.js'

const config = await loadConfig();


passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3030/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await UserModel.findOne({ googleId: profile.id });

        if (!user) {
          const userId = await generateUniqueUserId();
          const newReferralCode = await genrateReferral(profile.displayName);
          user = new UserModel({
            userId,
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            referralCode: newReferralCode,
          });

          await user.save();
          logger.info(`New user created: ${user.email}`);
        } else {
          logger.info(`Existing user logged in: ${user.email}`);
        }

        const payload = { userId: user.userId, email: user.email };
        const token = jwt.sign(payload, config.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
        const newRefreshToken = jwt.sign(payload, config.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

        user.refreshToken = newRefreshToken;
        await user.save();
        return done(null, { user, accessToken: token, refreshToken: newRefreshToken });
      } catch (error) {
        logger.error(`Error in Google OAuth: ${error.message}`);
        return done(error, false);
      }
    }
  )
);


passport.serializeUser((user, done) => {
  done(null, user.user.userId);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(null, {
      status: 500,
      message: [error.message]
    });
  }
});

