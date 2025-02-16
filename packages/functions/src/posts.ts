import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { z } from "zod";
import { jsonValidator } from "../utils/json-validator";
import { createEmptyPost } from "@status-application/core/queries/posts";
import { generatePostPresignedUrls } from "../utils/presigned-url";

const postSchema = z.object({
    width: z.number().nonnegative(),
    height: z.number().nonnegative(),
});

const app = new Hono();

app.post("/api/posts/new", jsonValidator(postSchema), async (c) => {
    const params = c.req.valid("json");
    const username = c.req.header("user")!;

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
