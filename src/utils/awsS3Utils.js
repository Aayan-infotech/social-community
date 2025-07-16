import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import { ApiError } from "./ApiError.js";
import sharp from "sharp";
import { Upload } from "@aws-sdk/lib-storage";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { loadConfig } from "../config/loadConfig.js";

const secret = await loadConfig();

// Initialize the S3 client
const s3 = new S3Client({
  region: secret.AWS_REGION,
  // credentials: {
  //   accessKeyId: secret.AWS_ACCESS_KEY_ID,
  //   secretAccessKey: secret.AWS_SECRET_ACCESS_KEY,
  // },
});

// Function to upload an image to S3
const uploadImage = async (file) => {
  if (!file || !file.path || !file.filename || !file.mimetype) {
    throw new ApiError(400, "Invalid file input");
  }

  const filePath = file.path;

  try {
    const fileContent = fs.readFileSync(filePath);

    const params = {
      Bucket: secret.AWS_BUCKET_NAME,
      Key: file.filename,
      Body: fileContent,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);

    return {
      success: true,
      fileUrl: `https://${secret.AWS_BUCKET_NAME}.s3.${secret.AWS_REGION}.amazonaws.com/${file.filename}`,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new ApiError(500, "Failed to upload image to S3");
  } finally {
    // Always attempt cleanup
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (cleanupErr) {
      console.warn("File cleanup failed:", cleanupErr.message);
    }
  }
};
// Delete the image on the aws upload server using the imageURL
const deleteObject = async (imageUrl) => {
  try {
    const fileName = imageUrl.split("/").pop();
    const params = {
      Bucket: secret.AWS_BUCKET_NAME,
      Key: fileName,
    };

    await s3.send(new DeleteObjectCommand(params));
    return `${fileName} deleted successfully from S3`;
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

const saveCompressedImage = async (file, width, height) => {
  try {
    const resizedBuffer = await sharp(file.path)
      .resize(width)
      .toFormat("webp")
      .toBuffer();

    // generate a unique name for the thumbnail
    const thumbnailName = `image-${Date.now()}.webp`;
    const thumbnailPath = `public/temp/${thumbnailName}`;
    fs.writeFileSync(thumbnailPath, resizedBuffer);

    const fileObject = {
      path: thumbnailPath,
      originalname: thumbnailName,
      filename: thumbnailName,
      mimetype: "image/webp",
    };

    const thumbnailUrl = await uploadImage(fileObject);

    if (thumbnailUrl.success) {
      return {
        success: true,
        thumbnailUrl: thumbnailUrl.fileUrl,
      };
    } else {
      throw new ApiError(500, "Failed to upload thumbnail");
    }
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

const uploadVideo = async (file) => {
  try {
    if (!file) {
      throw new Error("No file uploaded");
    }

    const fileStream = fs.createReadStream(file.path);

    const uploadParams = {
      Bucket: secret.AWS_BUCKET_NAME,
      Key: `videos/${file.filename}`,
      Body: fileStream,
      ContentType: file.mimetype,
    };

    const upload = new Upload({
      client: s3,
      params: uploadParams,
      tags: [],
      queueSize: 3,
    });

    upload.on("httpUploadProgress", (progress) => {
      console.log(`Uploading: ${progress.loaded} / ${progress.total}`);
    });

    const result = await upload.done();

    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return { success: true, videoUrl: result.Location };
  } catch (error) {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    console.error(error);
    throw new ApiError(500, error.message);
  }
};

const compressVideo = (inputPath, outputFolder) => {
  return new Promise((resolve, reject) => {
    const compressedFilename = `compressed-${Date.now()}-${Math.round(Math.random() * 1e9)}.mp4`;
    const outputPath = path.join(outputFolder, compressedFilename);

    ffmpeg(inputPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .size("480x360")
      .fps(30)
      .outputOptions([
        "-preset slow",
        "-crf 28",
        "-profile:v main",
        "-level 3.1",
        "-pix_fmt yuv420p",
        "-movflags +faststart"
      ])
      .on("end", () => resolve({ success: true, outputPath }))
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
};

const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const durationInSeconds = metadata.format.duration;
      resolve(durationInSeconds);
    });
  });
};

export {
  uploadImage,
  deleteObject,
  saveCompressedImage,
  uploadVideo,
  compressVideo,
  getVideoDuration
};
