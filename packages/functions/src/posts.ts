import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { z } from "zod";
import { jsonValidator } from "../utils/json-validator";
import {
    createEmptyPost,
    getPostsForUserWithinRange,
} from "@status-application/core/queries/posts";
import { generatePostPresignedUrls } from "../utils/presigned-url";
import { getMidnightEpoch } from "../utils/get-midnight-date";
import { DAILY_POST_LIMIT } from "@status-application/core/utils/constants";

const postSchema = z.object({
    width: z.number().nonnegative(),
    height: z.number().nonnegative(),
});

const app = new Hono();

app.post("/api/posts/new", jsonValidator(postSchema), async (c) => {
    const params = c.req.valid("json");
    const username = c.req.header("user")!;

    /**
     * Validate that the user has not exceeded the
     * daily post limit before creating a post.
     */
    try {
        const currentDayMidnight = getMidnightEpoch();

        const response = await getPostsForUserWithinRange(
            username,
            currentDayMidnight
        );
        if (response.Count && response.Count > DAILY_POST_LIMIT) {
            return c.json(
                { message: "User has posted too many times today." },
                404
            );
        }
    } catch (error) {
        return c.json(
            { message: "Could not validate post history.", error },
            400
        );
    }

    try {
        /**
         * Create empty post object to save in DDB
         * for other images to be attached via pre-signed URL
         * upload.
         */
        const postId = await createEmptyPost(username);

        /**
         * Generate pre-signed URLs for primary and secondary
         * post images.
         */
        const keyPrefix = `images/${username}/posts`;
        const [primaryUrl, secondaryUrl] = await generatePostPresignedUrls(
            keyPrefix,
            postId,
            { width: params.width, height: params.height },
            { width: params.width, height: params.height }
        );

        return c.json({ primary: primaryUrl, secondary: secondaryUrl }, 200);
    } catch (error) {
        return c.json({ message: "Could not create post.", error }, 400);
    }
});

export const handler = handle(app);
