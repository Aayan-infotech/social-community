import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  friendRequest,
  getUserProfile,
  updateUserProfile,
  acceptRejectFriendRequest,
  getFriendRequestList,
  getFriendList,
  getFriendSuggestionList
} from "../controllers/users.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { updateProfileSchema } from "../validators/userValidator.js";
import errorHandler from "../middlewares/errorhandler.middleware.js";


const router = Router();

router.get("/get-profile", verifyJWT, getUserProfile);
router.post(
  "/update-profile",
  verifyJWT,
  validateRequest(updateProfileSchema),
  upload.fields([
    {
      name: "profile_image",
      maxCount: 1,
    },
  ]),
  errorHandler,
  updateUserProfile
);

router.post('/friend-request',verifyJWT,friendRequest);
router.put('/accept-reject-friend-request',verifyJWT,acceptRejectFriendRequest);
router.get('/get-friend-request',verifyJWT,getFriendRequestList);
router.get('/get-friends',verifyJWT,getFriendList);
router.get('/get-friend-suggestions',verifyJWT,getFriendSuggestionList);


export default router;
