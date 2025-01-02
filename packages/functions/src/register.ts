import {
    createUser,
    getUserByUsername,
} from "@status-application/core/queries/users";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { validator } from "hono/validator";
import { z } from "zod";

const registerSchema = z.object({
    username: z.string().nonempty(),
    name: z.string().nonempty(),
    email: z.string().email(),
    password: z.string().min(8, { message: "Enter at least 8 characters" }),
});

const app = new Hono();

app.put(
    "/api/register",
    validator("json", (value, c) => {
        const parsed = registerSchema.safeParse(value);
        if (!parsed.success) {
            return c.json({ message: "Invalid input." }, 400);
        }
        return parsed.data;
    }),
    async (c) => {
        const params = c.req.valid("json");

        /**
         * Create new user if not already present.
         */
        try {
            const userRequest = await createUser(
                params.username,
                params.name,
                params.email,
                params.password
            );
            if (userRequest.$metadata.httpStatusCode === 200) {
                return c.json({ message: "User created." }, 201);
            }
        } catch (error) {
            return c.json({ message: "Unsuccessful creation.", error }, 400);
        }
    }
);

export const handler = handle(app);
