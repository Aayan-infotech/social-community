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
  addPages,
  saveFAQ,
  getPrivacyPolicy,
  getTermsAndConditions,
  getFAQ,
  updateMatrimonialProfile,
  getMatrimonialProfile,
  getAllInfoPages,
  getResources,
  updateProfessionalImage,
  getProfessionalProfile,
  searchSkills,
  searchAllUsers,
  deleteFriendRequest,
  sendNotification,
  uploadChatDocument,
  removeFriend,
  getMatrimonialProfileSuggestions,
  sendInterest,
  acceptRejectInterest,
  getInterrestedProfiles
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
  addPagesSchema,
  saveFAQSchema,
  updateMatrimonialProfileSchema,
  sendNotificationSchema,
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
  "/update-professional-image",
  verifyJWT,
  upload.fields([
    {
      name: "professional_image",
      maxCount: 1,
    },
  ]),
  errorHandler,
  updateProfessionalImage
);

router.get('/get-professional-profile', verifyJWT, getProfessionalProfile);
router.get("/search-skills", verifyJWT, searchSkills);

router.post(
  "/friend-request",
  validateRequest(friendRequestSchema),
  verifyJWT,
  friendRequest
);
router.delete('/friend-request', verifyJWT, deleteFriendRequest);
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

router.get("/get-stories", verifyJWT, getStories);

router.post("/delete-account-request", verifyJWT, deleteAccountRequest);

// web apis
router.get("/get-all-users", verifyJWT, getAllUsers);
router.get("/get-all-delete-request", verifyJWT, getAllDeleteRequest);
router.put(
  "/update-delete-request",
  verifyJWT,
  validateRequest(updateDeleteRequestSchema),
  updateDeleteRequest
);
router.post(
  "/save-resource",
  verifyJWT,
  validateRequest(saveResourcesSchema),
  saveResources
);
router.get("/get-resources", verifyJWT, getResources);
router.post("/add-pages", verifyJWT, validateRequest(addPagesSchema), addPages);
router.post("/FAQ", verifyJWT, validateRequest(saveFAQSchema), saveFAQ);
router.get("/privacy-policy", verifyJWT, getPrivacyPolicy);
router.get("/terms-and-conditions", verifyJWT, getTermsAndConditions);
router.get("/FAQ", verifyJWT, getFAQ);
// Users Matrimonial Profile
router.put(
  "/update-matrimonial-profile",
  verifyJWT,
  validateRequest(updateMatrimonialProfileSchema),
  updateMatrimonialProfile
);
router.get("/get-matrimonial-profile", verifyJWT, getMatrimonialProfile);
router.get("/get-matrimonial-suggestions", verifyJWT, getMatrimonialProfileSuggestions);
router.post('/sent-interest',verifyJWT,sendInterest);
router.put('/accept-reject-interest',verifyJWT,acceptRejectInterest);
router.get('/get-interest-profiles',verifyJWT,getInterrestedProfiles);

// Info Pages
router.get("/info-pages", verifyJWT, getAllInfoPages);
router.get("/search", verifyJWT, searchAllUsers);
router.post("/send-notification", verifyJWT, validateRequest(sendNotificationSchema), sendNotification);
router.post('/upload-chat-document', verifyJWT, upload.fields([
  {
    name: "document",
    maxCount: 1,
  },
]), errorHandler, uploadChatDocument);

router.post('/remove-friend',verifyJWT,removeFriend);

export default router;
