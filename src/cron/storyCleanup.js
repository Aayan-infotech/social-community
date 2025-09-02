import cron from "node-cron";
import { Story } from "../models/story.model.js";
import { deleteObject } from "../utils/awsS3Utils.js";


const storyCleanup = cron.schedule("0 * * * *", async () => {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const expiredStories = await Story.find(
            { createdAt: { $lt: yesterday } },
            { _id: 1, mediaUrl: 1 }
        );

        if (!expiredStories.length) return;

        const mediaUrls = expiredStories
            .map(story => story.mediaUrl)
            .filter(Boolean);

        if (mediaUrls.length > 0) {
            try {
                await Promise.all(mediaUrls.map(url => deleteObject(url)));
            } catch (err) {
                console.error("Failed to delete some media from S3:", err);
            }
        }

        const storyIds = expiredStories.map(story => story._id);
        await Story.deleteMany({ _id: { $in: storyIds } });

        console.log(`✅ Cleaned up ${storyIds.length} expired stories.`);
    } catch (err) {
        console.error("Story cleanup failed:", err);
    }
});


export default storyCleanup;