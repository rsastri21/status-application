import { Context, Hono } from "hono";
import { handle } from "hono/aws-lambda";

import {
    createFriendRequest,
    engageFriendRequest,
    getFriendRequest,
    getFriends,
    getReceivedFriendRequests,
    getSentFriendRequests,
    removeFriend,
} from "@status-application/core/queries/friends";
import { QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
import { BlankEnv, BlankInput } from "hono/types";
import { z } from "zod";
import { jsonValidator } from "../utils/json-validator";
import { getUserByUsername } from "@status-application/core/queries/users";
import { Relationship } from "@status-application/core/types";

const friendRequestSchema = z.object({
    friend: z.string().nonempty(),
});

const engageRequestSchema = z.object({
    friend: z.string().nonempty(),
    action: z.enum(["accept", "reject"]),
});

const friendRequestProcessor = async (
    c: Context<BlankEnv, "/api/relationships/friends", BlankInput>,
    executor: (username: string) => Promise<QueryCommandOutput>
) => {
    const username = c.req.header("user");

    try {
        // An undefined username will be caught by the auth lambda
        const response = await executor(username!);
        return c.json(response.Items ?? [], 200);
    } catch (error: any) {
        if (error.name === "ValidationException") {
            return c.json([], 200);
        }
        return c.json({ message: "Error retrieving information.", error }, 400);
    }
};

const app = new Hono();

/**
 * Gets all friends for the current user.
 */
app.get("/api/relationships/friends", async (c) => {
    return await friendRequestProcessor(c, getFriends);
});

/**
 * Gets sent friend requests for the current user.
 */
app.get("/api/relationships/friend-requests/sent", async (c) => {
    return await friendRequestProcessor(c, getSentFriendRequests);
});

/**
 * Gets received friend requests for the current user.
 */
app.get("/api/relationships/friend-requests/received", async (c) => {
    return await friendRequestProcessor(c, getReceivedFriendRequests);
});

app.post(
    "/api/relationships/friend-requests/new",
    jsonValidator(friendRequestSchema),
    async (c) => {
        const params = c.req.valid("json");
        const username = c.req.header("user");

        /**
         * Validate that the target for the new friend
         * request is a user that exists in the DB.
         */
        try {
            const response = await getUserByUsername(params.friend);

            if (!response.Item) {
                return c.json({ message: "Target user does not exist." }, 404);
            }
        } catch (error) {
            return c.json({ message: "Error validating target user." }, 400);
        }

        /**
         * Create friend request.
         */
        try {
            const response = await createFriendRequest(
                username!,
                params.friend
            );

            if (response.$metadata.httpStatusCode === 200) {
                return c.json(
                    { message: "Request created successfully." },
                    200
                );
            }
            return c.json({ message: "Failed to create friend request." }, 400);
        } catch (error) {
            return c.json(
                { message: "Failed to create friend request.", error },
                400
            );
        }
    }
);

app.post(
    "/api/relationships/friend-requests/engage",
    jsonValidator(engageRequestSchema),
    async (c) => {
        const params = c.req.valid("json");
        const username = c.req.header("user");

        /**
         * Get the existing friend request and verify that
         * the engaging user is not the requester.
         */
        try {
            const response = await getFriendRequest(username!, params.friend);

            if (!response.Item) {
                return c.json({ message: "Could not validate request." }, 404);
            }

            const friendRequest = response.Item as Relationship;
            /**
             * A user can reject their own request, but cannot accept
             * their own request.
             */
            if (
                friendRequest.requester === username &&
                params.action === "accept"
            ) {
                return c.json({ message: "Cannot accept own request." }, 400);
            }
        } catch (error) {
            return c.json(
                { message: "Failed to validate request.", error },
                400
            );
        }

        try {
            const response = await engageFriendRequest(
                username!,
                params.friend,
                params.action
            );

            if (response.$metadata.httpStatusCode === 200) {
                return c.json(
                    { message: `Request ${params.action}ed successfully.` },
                    200
                );
            }
        } catch (error) {
            return c.json({ message: "Failed to engage request.", error }, 400);
        }
    }
);

app.post(
    "/api/relationships/friends/remove",
    jsonValidator(friendRequestSchema),
    async (c) => {
        const params = c.req.valid("json");
        const username = c.req.header("user");

        try {
            const response = await removeFriend(username!, params.friend);

            if (response.$metadata.httpStatusCode === 200) {
                return c.json({ message: "Friend successfully removed." }, 200);
            }
        } catch (error) {
            return c.json({ message: "Failed to remove friend.", error }, 400);
        }
    }
);

export const handler = handle(app);
