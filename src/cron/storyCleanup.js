import cron from "node-cron";
import { Story } from "../models/story.model.js";
import { deleteObject } from "../utils/awsS3Utils.js";


const storyCleanup = cron.schedule("0 * * * *", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const deletedStories = await Story.find({ createdAt: { $lt: yesterday } });

    for (const story of deletedStories) {
        if (story.mediaUrl) {
            try {
                await deleteObject(story.mediaUrl);
            } catch (err) {
                console.error(`Failed to delete media from S3 for story ${story._id}:`, err);
            }
        }
        await Story.deleteOne({ _id: story._id });
    }
});

export default storyCleanup;