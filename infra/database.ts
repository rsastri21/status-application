export const users = new sst.aws.Dynamo("UserTable", {
    fields: {
        username: "string",
    },
    primaryIndex: {
        hashKey: "username",
    },
});

export const sessions = new sst.aws.Dynamo("SessionTable", {
    fields: {
        username: "string",
        sessionId: "string",
    },
    primaryIndex: {
        hashKey: "username",
        rangeKey: "sessionId",
    },
    ttl: "expiresAt",
});
