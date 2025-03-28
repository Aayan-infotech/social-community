import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPost,
  getPosts,
  likeDisLikePost,
  addComment,
  editComment,
  getComments,
  addReplyComment,
  getPostDetails
} from "../controllers/posts.controller.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  postValidationSchema,
  postLikeDislikeSchema,
  postCommentSchema,
  postEditCommentSchema,
} from "../validators/postValidator.js";
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

router.get("/get-posts", verifyJWT, getPosts);
router.put(
  "/like-dislike-post",
  verifyJWT,
  validateRequest(postLikeDislikeSchema),
  likeDisLikePost
);
router.post(
  "/add-comment",
  verifyJWT,
  validateRequest(postCommentSchema),
  addComment
);
router.put(
  "/edit-comment",
  verifyJWT,
  validateRequest(postEditCommentSchema),
  editComment
);
router.get("/get-comments/:postId", verifyJWT, getComments);
router.post("/add-reply",verifyJWT, addReplyComment);

router.get('/post-details/:postId',verifyJWT,getPostDetails);

export default router;
