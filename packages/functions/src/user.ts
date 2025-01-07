import { getUserByUsername } from "@status-application/core/queries/users";
import { User } from "@status-application/core/types";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

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

export const handler = handle(app);
