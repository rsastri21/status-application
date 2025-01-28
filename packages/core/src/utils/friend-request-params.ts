import { Resource } from "sst";

export const generateUpdateParams = (username: string, friend: string) => {
    return {
        TransactItems: [
            {
                Update: {
                    TableName: Resource.RelationshipTable.name,
                    Key: {
                        username: username,
                        friend: friend,
                    },
                    UpdateExpression: "SET isPending = :isPendingVal",
                    ExpressionAttributeValues: {
                        ":isPendingVal": false,
                    },
                },
            },
            {
                Update: {
                    TableName: Resource.RelationshipTable.name,
                    Key: {
                        username: friend,
                        friend: username,
                    },
                    UpdateExpression: "SET isPending = :isPendingVal",
                    ExpressionAttributeValues: {
                        ":isPendingVal": false,
                    },
                },
            },
        ],
    };
};

export const generateDeleteParams = (username: string, friend: string) => {
    return {
        TransactItems: [
            {
                Delete: {
                    TableName: Resource.RelationshipTable.name,
                    Key: {
                        username: username,
                        friend: friend,
                    },
                },
            },
            {
                Delete: {
                    TableName: Resource.RelationshipTable.name,
                    Key: {
                        username: friend,
                        friend: username,
                    },
                },
            },
        ],
    };
};
