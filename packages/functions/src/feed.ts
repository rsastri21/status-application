import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

const app = new Hono();

app.get("/api/feed/friends", async (c) => {});

app.get("/api/feed/user", async (c) => {});

export const handler = handle(app);
