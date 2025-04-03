import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  friendRequest,
  getUserProfile,
  updateUserProfile,
  acceptRejectFriendRequest,
  getFriendRequestList,
  getFriendList,
  getFriendSuggestionList,
  getNotifications,
  getUserPosts,
  updateUserAboutMe,
  upsertExperience,
  upsertEducation
} from "../controllers/users.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  updateProfileSchema,
  friendRequestSchema,
  acceptRejectFriendRequestSchema,
  upsertExperienceSchema,
  educationSchema
} from "../validators/userValidator.js";
import errorHandler from "../middlewares/errorhandler.middleware.js";

const router = Router();

router.get("/get-profile", verifyJWT, getUserProfile);
router.post(
  "/update-profile",
  verifyJWT,
  upload.fields([
    {
      name: "profile_image",
      maxCount: 1,
    },
  ]),
  validateRequest(updateProfileSchema),
  errorHandler,
  updateUserProfile
);

router.post(
  "/friend-request",
  validateRequest(friendRequestSchema),
  verifyJWT,
  friendRequest
);
router.put(
  "/accept-reject-friend-request",
  validateRequest(acceptRejectFriendRequestSchema),
  verifyJWT,
  acceptRejectFriendRequest
);
router.get("/get-friend-request", verifyJWT, getFriendRequestList);
router.get("/get-friends", verifyJWT, getFriendList);
router.get("/get-friend-suggestions", verifyJWT, getFriendSuggestionList);
router.get("/get-notifications", verifyJWT, getNotifications);
router.get('/get-user-posts', verifyJWT, getUserPosts);
router.put('/update-about-me', verifyJWT, updateUserAboutMe);
router.post('/upsert-experience',verifyJWT, validateRequest(upsertExperienceSchema),upsertExperience);
router.post('/upsert-education',verifyJWT,validateRequest(educationSchema),upsertEducation);

export default router;
