import {
    getUserByUsername,
    updateUser,
} from "@status-application/core/queries/users";
import { User, UserUpdate } from "@status-application/core/types";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { z } from "zod";
import { jsonValidator } from "../utils/json-validator";

const updateUserSchema = z.object({
    username: z.string().nonempty(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    profile: z
        .object({
            image: z.string().url().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
        })
        .optional(),
});

const app = new Hono();

/**
 * Gets the current user's profile or another
 * user if specified via query params.
 */
app.get("/api/user/profile", async (c) => {
    const username = c.req.query("username");

    if (username) {
        /**
         * Lookup the provided user based on the query param
         * and throw an error if there is no corresponding user found.
         */
        try {
            const response = await getUserByUsername(username);

            if (!response.Item) {
                return c.json({ message: "User not found." }, 404);
            }
            return c.json(response.Item as User, 200);
        } catch (error) {
            return c.json({ message: "Error retrieving user.", error }, 400);
        }
    }

    try {
        const user = c.req.header("user");
        const response = await getUserByUsername(user!);

        if (!response.Item) {
            /**
             * Should never happen as authorizer lambda would
             * throw a 401 exception if the user did not exist.
             */
            return c.json({ message: "User not found." }, 404);
        }
        return c.json(response.Item as User, 200);
    } catch (error) {
        return c.json({ message: "Error retrieving user.", error }, 400);
    }
});

app.post(
    "/api/user/profile/edit",
    jsonValidator(updateUserSchema),
    async (c) => {
        const params = c.req.valid("json") as UserUpdate;
        let user: User;
        /**
         * Validate that the user attempting to be updated
         * exists in the DB.
         */
        try {
            const response = await getUserByUsername(params.username);

            if (!response.Item) {
                return c.json({ message: "User not found." }, 404);
            }
            user = response.Item as User;
        } catch (error) {
            return c.json({ message: "Error retrieving user.", error }, 400);
        }

        /**
         * Update user with the validated contents from
         * the request body.
         */
        try {
            const response = await updateUser({
                ...user,
                ...params,
            });

            if (response.$metadata.httpStatusCode === 200) {
                return c.json({ message: "User updated." }, 200);
            }
            return c.json({ message: "Unsuccessful update." }, 400);
        } catch (error) {
            return c.json({ message: "Unsuccessful update.", error }, 400);
        }
    }
);

export const handler = handle(app);
