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

export const relationships = new sst.aws.Dynamo("RelationshipTable", {
    fields: {
        username: "string",
        friend: "string",
    },
    primaryIndex: {
        hashKey: "username",
        rangeKey: "friend",
    },
});

export const posts = new sst.aws.Dynamo("PostTable", {
    fields: {
        username: "string",
        postId: "string",
    },
    primaryIndex: {
        hashKey: "username",
        rangeKey: "postId",
    },
});
