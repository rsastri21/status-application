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
import { tryCatch } from "@status-application/core/utils/try-catch";

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
    const currentDayMidnight = getMidnightEpoch();
    const { data, error } = await tryCatch(
        getPostsForUserWithinRange(username, currentDayMidnight)
    );

    if (error) {
        return c.json(
            { message: "Could not validate post history.", error },
            400
        );
    }

    if (data.Count && data.Count > DAILY_POST_LIMIT) {
        return c.json(
            { message: "User has posted too many times today." },
            404
        );
    }

    /**
     * Create empty post object to save in DDB
     * for other images to be attached via pre-signed URL
     * upload.
     */
    const { data: postId, error: postError } = await tryCatch(
        createEmptyPost(username)
    );

    if (postError) {
        return c.json(
            { message: "Failed to create empty post object.", postError },
            400
        );
    }

    /**
     * Generate pre-signed URLs for primary and secondary
     * post images.
     */
    const keyPrefix = `images/${username}/posts`;
    const { data: s3Response, error: s3Error } = await tryCatch(
        generatePostPresignedUrls(
            keyPrefix,
            postId,
            { width: params.width, height: params.height },
            { width: params.width, height: params.height }
        )
    );

    if (s3Error) {
        return c.json(
            {
                message: "Could not create upload location for post images.",
                s3Error,
            },
            400
        );
    }

    const [primaryUrl, secondaryUrl] = s3Response;
    return c.json({ primary: primaryUrl, secondary: secondaryUrl }, 200);
});

export const handler = handle(app);
