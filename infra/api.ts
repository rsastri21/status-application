import { users, sessions, relationships } from "./database";
import { bucket } from "./storage";

export const api = new sst.aws.ApiGatewayV2("Api");

const lambdaAuthorizer = api.addAuthorizer({
    name: "RequestAuthorizer",
    lambda: {
        function: {
            handler: "packages/functions/src/authorizer.handler",
            link: [sessions],
        },
        identitySources: ["$request.header.user", "$request.header.auth-token"],
    },
});

api.route("PUT /api/auth/register", {
    link: [users, sessions],
    handler: "packages/functions/src/auth.handler",
});

api.route("POST /api/auth/sign-in", {
    link: [users, sessions],
    handler: "packages/functions/src/auth.handler",
});

api.route(
    "POST /api/auth/sign-out",
    {
        link: [sessions],
        handler: "packages/functions/src/auth.handler",
    },
    {
        auth: {
            lambda: lambdaAuthorizer.id,
        },
    }
);

api.route(
    "ANY /api/user/{proxy+}",
    {
        link: [users, bucket],
        handler: "packages/functions/src/user.handler",
    },
    {
        auth: {
            lambda: lambdaAuthorizer.id,
        },
    }
);

api.route(
    "ANY /api/relationships/{proxy+}",
    {
        link: [relationships],
        handler: "packages/functions/src/relationships.handler",
    },
    {
        auth: {
            lambda: lambdaAuthorizer.id,
        },
    }
);
