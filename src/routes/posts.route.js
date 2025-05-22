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
  editReplyComment,
  getPostDetails,
  getPostLikedBy,
  getReplyofComment,
  updatePost,
  getShortsVideo,
  getHomeFeed,
  deletePost,
} from "../controllers/posts.controller.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  postValidationSchema,
  postLikeDislikeSchema,
  postCommentSchema,
  postEditCommentSchema,
  postReplySchema,
  postEditReplySchema,
  updatePostSchema,
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
      maxCount: 1,
    },
  ]),
  errorHandler,
  validateRequest(postValidationSchema),
  createPost
);

router.put(
  "/update-post",
  verifyJWT,
  upload.fields([
    {
      name: "media",
      maxCount: 1,
    },
  ]),
  validateRequest(updatePostSchema),
  errorHandler,
  updatePost
);
router.delete("/delete-post/:postId", verifyJWT, deletePost);

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
router.post(
  "/add-reply",
  verifyJWT,
  validateRequest(postReplySchema),
  addReplyComment
);
router.put(
  "/edit-reply",
  verifyJWT,
  validateRequest(postEditReplySchema),
  editReplyComment
);
router.get("/get-reply", verifyJWT, getReplyofComment);

router.get("/post-details/:postId", verifyJWT, getPostDetails);
router.get("/get-post-likedby/:postId", verifyJWT, getPostLikedBy);
router.get("/get-shorts",verifyJWT,getShortsVideo);
router.get("/get-home-feed",verifyJWT,getHomeFeed);

export default router;
