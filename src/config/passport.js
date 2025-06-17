import passport from "passport";
import jwt from "jsonwebtoken";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { generateUniqueUserId, generateReferralCode, getHierarchyLevel } from '../utils/HelperFunctions.js';
import { User } from '../models/user.model.js';
import { loadConfig } from './loadConfig.js';
import FamilyMember from '../models/familyMember.model.js';
import {
    createCustomer,
    createConnectAccount,
} from "../services/stripeService.js";

const config = await loadConfig();

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        let refreshToken = user.refreshToken;
        try {
            jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET);
        } catch (error) {
            refreshToken = user.generateRefreshToken();
            user.refreshToken = refreshToken;
            await user.save({ validateBeforeSave: false });
        }

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        );
    }
};


passport.use(
    new GoogleStrategy(
        {
            clientID: config.GOOGLE_CLIENT_ID,
            clientSecret: config.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://18.209.91.97:3030/api/auth/google/callback"
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id }).select("_id userId name email profile_image refreshToken");
                if (!user) {
                    const userId = await generateUniqueUserId();
                    const newReferralCode = await generateReferralCode(profile.displayName);

                    const stripeCustomer = await createCustomer(userEmail, name);

                    if (!stripeCustomer) {
                        throw new ApiError(500, "Failed to create customer in Stripe");
                    }

                    const stripeCustomerId = stripeCustomer.id;

                    // Create a Connect Account in stripe
                    const stripeAccount = await createConnectAccount(userEmail);
                    if (!stripeAccount) {
                        throw new ApiError(500, "Failed to create connect account in Stripe");
                    }
                    const stripeAccountId = stripeAccount.id;


                    user = new User({
                        userId,
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        referralCode: newReferralCode,
                        profile_image: profile.photos[0].value,
                        isEmailVerified: true,
                        isMobileVerified: true,
                    });

                    await user.save();

                    const hierarchyLevel1 = getHierarchyLevel("self");
                    const addFamilyMember = await FamilyMember.create({
                        userId: userId,
                        relationship: "self",
                        relationWithUserId: userId,
                        hierarchyLevel: hierarchyLevel1,
                    });
                }

                const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
                    user._id
                );

                user.refreshToken = refreshToken;
                await user.save();
                return done(null, { user, accessToken, refreshToken });
            } catch (error) {
                console.error("Google OAuth Error:", error);
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
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(null, {
            status: 500,
            message: [error.message]
        });
    }
});

