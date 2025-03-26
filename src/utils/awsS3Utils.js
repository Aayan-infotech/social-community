import { S3Client, PutObjectCommand ,DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import { ApiError } from "./ApiError.js";

// Initialize the S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Function to upload an image to S3
const uploadImage = async (file) => {
  try {
    const fileContent = fs.readFileSync(file.path);
    if (!fileContent) {
      throw new ApiError(400, "Invalid file");
    }

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.filename,
      Body: fileContent,
      ContentType: file.mimetype,
    };


    const command = new PutObjectCommand(params);
    const data = await s3.send(command);

    fs.unlinkSync(file.path);

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.filename}`;
  } catch (error) {
    fs.unlinkSync(file.path);
    throw new ApiError(500, error.message);
  }
};

// Delete the image on the aws upload server using the imageURL 
const deleteImage = async (imageUrl) => {
  try {
    const fileName = imageUrl.split('/').pop();
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
    };

    await s3.send(new DeleteObjectCommand(params));
    return `Image ${fileName} deleted successfully from S3`;  
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

export { uploadImage ,deleteImage };

