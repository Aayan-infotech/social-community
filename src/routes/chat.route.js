import { Router } from "express";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createGroup,
  sendMessage,
  getGroupDetails,
  getChats,
} from "../controllers/chat.controller.js";
import { createGroupValidationSchema } from "../validators/chatValidator.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post(
  "/create-group",
  verifyJWT,
  upload.fields([
    {
      name: "groupIcon",
      maxCount: 1,
    },
  ]),
  validateRequest(createGroupValidationSchema),
  createGroup
);
router.get("/get-group/:groupId", verifyJWT, getGroupDetails);
router.post("/send-message", verifyJWT, sendMessage);
router.get("/", verifyJWT, getChats);

export default router;
