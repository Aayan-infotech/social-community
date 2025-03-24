import fs from "fs";
import AWS from "aws-sdk";
import { asyncHanlder } from "./asyncHandler.js";
import { ApiError } from "./ApiError.js";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const uploadImage = async (file) => {
  try {
    const fileContent = fs.readFileSync(file.path);
    if (!fileContent) {
      throw new ApiError(400, "Invalid file");
    }

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.originalname,
      Body: fileContent,
    };

    const data = await s3.upload(params).promise();
    return data.Location;
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

export { uploadImage };
