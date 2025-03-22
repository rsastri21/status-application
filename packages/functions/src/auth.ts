import {
    createUser,
    getUserByUsername,
} from "@status-application/core/queries/users";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { z } from "zod";
import { jsonValidator } from "../utils/json-validator";
import { User } from "@status-application/core/types";
import { verifyPassword } from "@status-application/core/utils/password";
import { generateSessionToken } from "@status-application/core/utils/auth";
import {
    createSession,
    deleteSession,
    SESSION_EXPIRY_TIME,
} from "@status-application/core/queries/sessions";
import { tryCatch } from "@status-application/core/utils/try-catch";

const registerSchema = z.object({
    username: z.string().nonempty(),
    name: z.string().nonempty(),
    email: z.string().email(),
    password: z.string().min(8, { message: "Enter at least 8 characters" }),
});

const signInSchema = z.object({
    username: z.string().nonempty(),
    password: z.string().nonempty(),
});

const app = new Hono();

/**
 * Creates a new user if not already present.
 */
app.put("/api/auth/register", jsonValidator(registerSchema), async (c) => {
    const params = c.req.valid("json");
    const { data, error } = await tryCatch(
        createUser(params.username, params.name, params.email, params.password)
    );

    if (error) {
        return c.json({ message: "Unsuccessful registration.", error }, 400);
    }

    if (data.$metadata.httpStatusCode === 200) {
        return c.json({ message: "User created." }, 201);
    }
    return c.json({ message: "Unsuccessful registration." }, 400);
});

app.post("/api/auth/sign-in", jsonValidator(signInSchema), async (c) => {
    const params = c.req.valid("json");

    const { data, error } = await tryCatch(getUserByUsername(params.username));

    if (error) {
        return c.json({ message: "Sign-in unsuccessful.", error }, 400);
    }

    if (!data.Item) {
        return c.json({ message: "Account not found." }, 404);
    }

    const user = data.Item as User;

    const isPasswordCorrect = await verifyPassword(
        params.password,
        user.salt,
        user.password
    );

    if (!isPasswordCorrect) {
        return c.json({ message: "Incorrect login information." }, 401);
    }

    const token = generateSessionToken();
    const { data: sessionResponse, error: sessionResponseError } =
        await tryCatch(createSession(user.username, token));

    if (sessionResponseError) {
        return c.json({ message: "Could not create session.", error }, 400);
    }

    if (sessionResponse.$metadata.httpStatusCode !== 200) {
        return c.json({ message: "Sign-in unsuccessful." }, 400);
    }
    /**
     * Return expiry time as half of actual so the same token can be refreshed.
     */
    return c.json({
        message: "Sign-in successful.",
        authToken: token,
        expiresAt: Date.now() + SESSION_EXPIRY_TIME / 2,
    });
});

app.post("/api/auth/sign-out", async (c) => {
    const username = c.req.header("user");
    const token = c.req.header("auth-token");

    if (!username || !token) {
        return c.json({ message: "User or token not provided." }, 400);
    }

    const { error } = await tryCatch(deleteSession(username, token));

    if (error) {
        return c.json({ message: "Sign-out failed.", error }, 400);
    }
    return c.json({ message: "Signed-out successfully." });
});

export const handler = handle(app);
