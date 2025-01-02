import { users, sessions } from "./database";

export const api = new sst.aws.ApiGatewayV2("Api");

api.route("PUT /api/register", {
    link: [users, sessions],
    handler: "packages/functions/src/register.handler",
});
