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
  upsertEducation,
  addStory,
  getStories,
  getAllUsers,
  deleteAccountRequest,
  getAllDeleteRequest,
  updateDeleteRequest,
  saveResources,
} from "../controllers/users.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  updateProfileSchema,
  friendRequestSchema,
  acceptRejectFriendRequestSchema,
  upsertExperienceSchema,
  educationSchema,
  addStorySchema,
  updateDeleteRequestSchema,
  saveResourcesSchema,
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
router.get("/get-user-posts", verifyJWT, getUserPosts);
router.put("/update-about-me", verifyJWT, updateUserAboutMe);
router.post(
  "/upsert-experience",
  verifyJWT,
  validateRequest(upsertExperienceSchema),
  upsertExperience
);
router.post(
  "/upsert-education",
  verifyJWT,
  validateRequest(educationSchema),
  upsertEducation
);
router.post(
  "/add-story",
  verifyJWT,
  upload.fields([
    {
      name: "media",
      maxCount: 1,
    },
  ]),
  validateRequest(addStorySchema),
  errorHandler,
  addStory
);

router.get('/get-stories',verifyJWT,getStories);

router.post('/delete-account-request',verifyJWT,deleteAccountRequest);

// web apis
router.get("/get-all-users",verifyJWT,getAllUsers);
router.get("/get-all-delete-request",verifyJWT,getAllDeleteRequest);
router.put("/update-delete-request",verifyJWT,validateRequest(updateDeleteRequestSchema),updateDeleteRequest);
router.post("/save-resource",verifyJWT,validateRequest(saveResourcesSchema),saveResources);
// router.get("/get-resources",verifyJWT,getRE)


export default router;
