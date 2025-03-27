import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { z } from "zod";
import { jsonValidator } from "../utils/json-validator";
import {
    captionPost,
    commentPost,
    createEmptyPost,
    deletePost,
    getPostsForUserWithinRange,
    likePost,
    replyToComment,
} from "@status-application/core/queries/posts";
import { generatePostPresignedUrls } from "../utils/presigned-url";
import { getMidnightEpoch } from "../utils/get-midnight-date";
import { DAILY_POST_LIMIT } from "@status-application/core/utils/constants";
import { tryCatch } from "@status-application/core/utils/try-catch";

const postSchema = z.object({
    width: z.number().nonnegative(),
    height: z.number().nonnegative(),
});

const captionSchema = z.object({
    postId: z.string(),
    caption: z.string().max(140),
});

const likeSchema = z.object({
    username: z.string(),
    postId: z.string(),
    type: z.enum(["like", "dislike"]),
});

const commentSchema = z.object({
    username: z.string(),
    postId: z.string(),
    content: z.string().max(140),
});

const replySchema = z.object({
    username: z.string(),
    postId: z.string(),
    content: z.string().max(140),
    commentId: z.number().nonnegative(),
});

const app = new Hono();

app.post("/api/posts/new", jsonValidator(postSchema), async (c) => {
    const params = c.req.valid("json") as z.infer<typeof postSchema>;
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

app.post("/api/posts/caption", jsonValidator(captionSchema), async (c) => {
    const params = c.req.valid("json") as z.infer<typeof captionSchema>;
    const username = c.req.header("user")!;

    const { data, error } = await tryCatch(
        captionPost(username, params.postId as string, params.caption as string)
    );

    if (error) {
        return c.json({ message: "Failed to caption post.", error }, 400);
    }

    if (data.$metadata.httpStatusCode !== 200) {
        return c.json({ message: "Could not caption post." }, 400);
    }
    return c.json(
        { message: "Post captioned successfully.", post: data.Attributes },
        200
    );
});

app.post("/api/posts/like", jsonValidator(likeSchema), async (c) => {
    const { username, postId, type } = c.req.valid("json") as z.infer<
        typeof likeSchema
    >;

    const { data, error } = await tryCatch(likePost(username, postId, type));

    if (error) {
        return c.json({ message: "Failed to like post.", error }, 400);
    }
    return c.json(
        { message: "Successfully like post.", post: data.Attributes },
        200
    );
});

app.post("/api/posts/comment", jsonValidator(commentSchema), async (c) => {
    const { username, postId, content } = c.req.valid("json") as z.infer<
        typeof commentSchema
    >;
    const author = c.req.header("user")!;

    const { data, error } = await tryCatch(
        commentPost(username, postId, author, content)
    );

    if (error) {
        return c.json({ message: "Failed to comment on post.", error }, 400);
    }
    return c.json(
        { message: "Successfully commented on post.", post: data.Attributes },
        200
    );
});

app.post("/api/posts/comment/reply", jsonValidator(replySchema), async (c) => {
    const { username, postId, content, commentId } = c.req.valid(
        "json"
    ) as z.infer<typeof replySchema>;
    const author = c.req.header("user")!;

    const { data, error } = await tryCatch(
        replyToComment(username, postId, author, commentId, content)
    );

    if (error) {
        return c.json({ message: "Failed to reply on post.", error }, 400);
    }
    return c.json(
        { message: "Successfully replied on post.", post: data.Attributes },
        200
    );
});

app.delete("/api/posts/delete/:postId", async (c) => {
    const postId = c.req.param("postId");
    const username = c.req.header("user")!;

    const { error } = await tryCatch(deletePost(username, postId));

    if (error) {
        return c.json({ message: "Could not delete post.", error }, 400);
    }
    return c.json({ message: "Post deleted." }, 200);
});

export const handler = handle(app);
