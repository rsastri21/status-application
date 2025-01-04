import { validator } from "hono/validator";
import { z } from "zod";

export const jsonValidator = <T extends z.ZodType>(schema: T) =>
    validator("json", (value, c) => {
        const parsed = schema.safeParse(value);
        if (!parsed.success) {
            return c.json({ message: "Invalid input." }, 400);
        }
        return parsed.data;
    });
