import Joi from "joi";

const postValidationSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    "string.base": "Title must be a string.",
    "string.empty": "Title is required.",
    "string.min": "Title must be at least 3 characters.",
    "string.max": "Title cannot exceed 100 characters.",
    "any.required": "Title is required to create a post.",
  }),
  description: Joi.string().optional().allow("").messages({
    "string.base": "Description must be a string.",
  }),
  type: Joi.string().valid("social", "professional").messages({
    "string.base": "Type must be a string.",
    "any.only": 'Type must be either "social" or "professional".',
    "any.required": "Type is required.",
  }),
  media: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required().messages({
          "string.uri": "Media URL must be a valid URI.",
          "any.required": "Media URL is required.",
        }),
        type: Joi.string().valid("image", "video").messages({
          "string.base": "Media type must be a string.",
          "any.only": 'Media type must be either "image" or "video".',
          "any.required": "Media type is required.",
        }),
        size: Joi.number()
          .max(5 * 1024 * 1024)
          .messages({
            "number.max": "Media size must not exceed 5MB.",
          }), // Max 5MB
      })
    )
    .max(5)
    .optional()
    .messages({
      "array.max": "You can upload up to 5 media files.",
    }),
});

const postLikeDislikeSchema = Joi.object({
  postId: Joi.string().required().messages({
    "string.base": "Post ID must be a string.",
    "string.empty": "Post ID is required.",
    "any.required": "Post ID is required to like or dislike a post.",
  }),
  like: Joi.boolean().required().messages({
    "boolean.base": "Like must be a boolean.",
    "any.required": "Like is required to like or dislike a post.",
  }),
});

const postCommentSchema = Joi.object({
  postId: Joi.string().required().messages({
    "string.base": "Post ID must be a string.",
    "string.empty": "Post ID is required.",
    "any.required": "Post ID is required to comment on a post.",
  }),
  comment: Joi.string().required().messages({
    "string.base": "Comment must be a string.",
    "string.empty": "Comment is required.",
    "any.required": "Comment is required to comment on a post.",
  }),
});

const postEditCommentSchema = Joi.object({
  postId: Joi.string().required().messages({
    "string.base": "Post ID must be a string.",
    "string.empty": "Post ID is required.",
    "any.required": "Post ID is required to edit a comment on a post.",
  }),
  commentId: Joi.string().required().messages({
    "string.base": "Comment ID must be a string.",
    "string.empty": "Comment ID is required.",
    "any.required": "Comment ID is required to edit a comment on a post.",
  }),
  comment: Joi.string().required().messages({
    "string.base": "Comment must be a string.",
    "string.empty": "Comment is required.",
    "any.required": "Comment is required to edit a comment on a post.",
  }),
});

const postReplySchema = Joi.object({
  commentId: Joi.string().required().messages({
    "string.base": "Comment ID must be a string.",
    "string.empty": "Comment ID is required.",
    "any.required": "Comment ID is required to reply to a comment.",
  }),
  comment: Joi.string().required().messages({
    "string.base": "Reply must be a string.",
    "string.empty": "Reply is required.",
    "any.required": "Reply is required to reply to a comment.",
  })
});

const postEditReplySchema = Joi.object({
  replyId: Joi.string().required().messages({
    "string.base": "Reply ID must be a string.",
    "string.empty": "Reply ID is required.",
    "any.required": "Reply ID is required to edit a reply.",
  }),
  comment: Joi.string().required().messages({
    "string.base": "Reply must be a string.",
    "string.empty": "Reply is required.",
    "any.required": "Reply is required to edit a reply.",
  })
});

const updatePostSchema = Joi.object({
  postId: Joi.string().required().messages({
    "string.base": "Post ID must be a string.",
    "string.empty": "Post ID is required.",
    "any.required": "Post ID is required to update a post.",
  }),
  title: Joi.string().min(3).max(100).optional().messages({
    "string.base": "Title must be a string.",
    "string.empty": "Title is required.",
    "string.min": "Title must be at least 3 characters.",
    "string.max": "Title cannot exceed 100 characters.",
  }),
  description: Joi.string().optional().allow("").messages({
    "string.base": "Description must be a string.",
  }),
  type: Joi.string().valid("social", "professional").optional().messages({
    "string.base": "Type must be a string.",
    "any.only": 'Type must be either "social" or "professional".',
  }),
  media: Joi.string().optional().allow("").messages({
    "string.base": "media must be a string.",
  }),
});

const reportPostSchema = Joi.object({
  postId: Joi.string().required().messages({
    "string.base": "Post ID must be a string.",
    "string.empty": "Post ID is required.",
    "any.required": "Post ID is required to report a post.",
  }),
  reason: Joi.string().required().messages({
    "string.base": "Reason must be a string.",
    "string.empty": "Reason is required.",
    "any.required": "Reason is required to report a post.",
  }),
});

export {
  postValidationSchema,
  postLikeDislikeSchema,
  postCommentSchema,
  postEditCommentSchema,
  postReplySchema,
  postEditReplySchema,
  updatePostSchema,
  reportPostSchema
};
