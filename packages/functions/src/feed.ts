import { tryCatch } from "@status-application/core/utils/try-catch";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import {
    generateFriendsFeed,
    generateUserFeed,
} from "../utils/feed-generators";

const app = new Hono();

app.get("/api/feed/friends", async (c) => {
    const username = c.req.header("user")!;
    const from = c.req.query("from");
    const to = c.req.query("to");

    if (!from) {
        return c.json({ message: "Start date is required." }, 400);
    }

    const { data, error } = await tryCatch(
        generateFriendsFeed(username, Number(from), to ? Number(to) : undefined)
    );

    if (error) {
        return c.json(
            { message: "Could not generate friends feed.", error },
            400
        );
    }

    return c.json(data, 200);
});

app.get("/api/feed/user", async (c) => {
    const username = c.req.header("user")!;
    const from = c.req.query("from");
    const to = c.req.query("to");

    if (!from) {
        return c.json({ message: "Start date is required." }, 400);
    }

    const { data, error } = await tryCatch(
        generateUserFeed(username, Number(from), to ? Number(to) : undefined)
    );

    if (error) {
        return c.json({ message: "Could not generate user feed.", error }, 400);
    }

    return c.json(data, 200);
});

export const handler = handle(app);
