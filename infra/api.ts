import { users, sessions } from "./database";

export const api = new sst.aws.ApiGatewayV2("Api");

api.route("PUT /api/auth/register", {
    link: [users, sessions],
    handler: "packages/functions/src/auth.handler",
});

api.route("POST /api/auth/sign-in", {
    link: [users, sessions],
    handler: "packages/functions/src/auth.handler",
});
