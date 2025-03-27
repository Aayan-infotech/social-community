import PostModel from "../models/posts.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadImage } from "../utils/awsS3Utils.js";

const createPost = asyncHandler(async (req, res) => {
    const { title,description,type  } = req.body;

   // upload the post media to the AWS
    let media = [];
    if (req.files && req.files.media) {
        // req.files.media is an array of media files
        for (const file of req.files.media) {
            console.log(file);
            media.push(await uploadImage(file));
        }
    }


    // save the post data
    const post = new PostModel({
        title,
        description,
        type,
        userId: req.user.userId,
        media
    });

    await post.save();
    res.status(200).json({
        status: 200,
        message: "Post created successfully",
        data: post
    });
});


export { createPost };