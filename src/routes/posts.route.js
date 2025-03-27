import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPost } from "../controllers/posts.controller.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { postValidationSchema } from "../validators/postValidator.js";
import { upload } from "../middlewares/multer.middleware.js";
import errorHandler from "../middlewares/errorhandler.middleware.js";

const router = Router();

router.post(
  "/create-post",
  verifyJWT,
  upload.fields([
    {
      name: "media",
      maxCount: 2,
    },
  ]),
  errorHandler,
  validateRequest(postValidationSchema),
  createPost
);

export default router;
