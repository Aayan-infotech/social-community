import Version from "../models/checkVersion.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const checkVersion = asyncHandler(async (req, res, next) => {
    const version = req.header("appVersion");
    if (!version) {
        throw new ApiError(400, "App version is required");
    }

     const latestVersionDoc = await Version.findOne().sort({ createdAt: -1 });

    if (!latestVersionDoc) {
        throw new ApiError(500, "No version found in database");
    }

    const latestVersion = latestVersionDoc.version;

    if (version !== latestVersion) {
        throw new ApiError(
            400,
            `You are using an older version (${version}). Kindly update to the latest version (${latestVersion}).`
        );
    }

    next();
});