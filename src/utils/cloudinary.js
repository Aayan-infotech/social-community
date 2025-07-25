
import { v2 as cloudinary } from 'cloudinary';
// import fs from "fs"
import { loadConfig } from '../config/loadConfig.js';

const config = await loadConfig();

cloudinary.config({
    cloud_name: config.CLOUDINARY_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_SECRET_KEY
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        // fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export { uploadOnCloudinary }