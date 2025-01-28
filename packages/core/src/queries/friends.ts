import {
    GetCommand,
    QueryCommand,
    TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDbProvider } from "../utils/dynamo-client";
import { Resource } from "sst";
import { Relationship } from "../types";
import {
    generateDeleteParams,
    generateUpdateParams,
} from "../utils/friend-request-params";

const filterConditionMap = {
    sent: "=",
    received: "<>",
};

type Status = keyof typeof filterConditionMap;

// TODO: Need to update this to handle pagination
const queryFriends = async (
    username: string,
    isPending: boolean,
    status?: Status
) => {
    const client = DynamoDbProvider.getInstance();

    const params = status
        ? {
              TableName: Resource.RelationshipTable.name,
              KeyConditionExpression: "username = :pkval",
              FilterExpression: `isPending = :isPendingVal AND requester ${filterConditionMap[status]} :requesterVal`,
              ExpressionAttributeValues: {
                  ":pkval": username,
                  ":isPendingVal": isPending,
                  ":requesterVal": username,
              },
          }
        : {
              TableName: Resource.RelationshipTable.name,
              KeyConditionExpression: "username = :pkval",
              FilterExpression: "isPending = :isPendingVal",
              ExpressionAttributeValues: {
                  ":pkval": username,
                  ":isPendingVal": isPending,
              },
          };

    const command = new QueryCommand(params);

    const response = await client.send(command);
    return response;
};

/**
 * Gets all friends for a user based on the username. The
 * isPending value represents whether a relationship is in
 * the request state or confirmed state, so the query asserts
 * that the isPending value to be false to find all
 * confirmed relationships.
 *
 * @param username The username to get all friends for.
 * @returns DynamoDB response for the query command.
 */
export const getFriends = async (username: string) => {
    return queryFriends(username, false);
};

export const getReceivedFriendRequests = async (username: string) => {
    return queryFriends(username, true, "received");
};

export const getSentFriendRequests = async (username: string) => {
    return queryFriends(username, true, "sent");
};

export const createFriendRequest = async (username: string, friend: string) => {
    const client = DynamoDbProvider.getInstance();

    const requester: Relationship = {
        username,
        friend,
        isPending: true,
        requester: username,
        createdAt: Date.now(),
    };
    const target: Relationship = {
        username: friend,
        friend: username,
        isPending: true,
        requester: username,
        createdAt: Date.now(),
    };

    const params = {
        TransactItems: [
            {
                Put: {
                    TableName: Resource.RelationshipTable.name,
                    Item: requester,
                    ConditionExpression:
                        "attribute_not_exists(username) AND attribute_not_exists(friend)",
                },
            },
            {
                Put: {
                    TableName: Resource.RelationshipTable.name,
                    Item: target,
                    ConditionExpression:
                        "attribute_not_exists(username) AND attribute_not_exists(friend)",
                },
            },
        ],
    };

    const command = new TransactWriteCommand(params);
    const response = await client.send(command);
    return response;
};

export const engageFriendRequest = async (
    username: string,
    friend: string,
    action: "accept" | "reject"
) => {
    const client = DynamoDbProvider.getInstance();

    const params =
        action === "accept"
            ? generateUpdateParams(username, friend)
            : generateDeleteParams(username, friend);

    const command = new TransactWriteCommand(params);
    const response = await client.send(command);
    return response;
};

export const getFriendRequest = async (username: string, friend: string) => {
    const client = DynamoDbProvider.getInstance();

    const command = new GetCommand({
        TableName: Resource.RelationshipTable.name,
        Key: {
            username: username,
            friend: friend,
        },
    });

    const response = await client.send(command);
    return response;
};
