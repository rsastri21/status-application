/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
    app(input) {
        return {
            name: "status-application",
            removal: input?.stage === "production" ? "retain" : "remove",
            home: "aws",
        };
    },
    async run() {
        await import("./infra/storage");
        await import("./infra/database");
        await import("./infra/api");

        if ($app.stage === "production") {
            const github = new aws.iam.OpenIdConnectProvider("GithubProvider", {
                url: "https://token.actions.githubusercontent.com",
                clientIdLists: ["sts.amazonaws.com"],
                thumbprintLists: [
                    "6938fd4d98bab03faadb97b34396831e3780aea1",
                    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
                ],
            });
            const githubRole = new aws.iam.Role("GithubRole", {
                name: [$app.name, $app.stage, "github"].join("-"),
                assumeRolePolicy: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Principal: {
                                Federated: github.arn,
                            },
                            Action: "sts:AssumeRoleWithWebIdentity",
                            Condition: {
                                StringLike: github.url.apply((url) => ({
                                    [`${url}:sub`]:
                                        "repo:rsastri21/status-application:*",
                                })),
                            },
                        },
                    ],
                },
            });
            new aws.iam.RolePolicyAttachment("GithubRolePolicy", {
                policyArn: "arn:aws:iam::aws:policy/AdministratorAccess",
                role: githubRole.name,
            });
        }
    },
});
