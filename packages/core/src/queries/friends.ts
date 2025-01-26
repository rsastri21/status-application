import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDbProvider } from "../utils/dynamo-client";
import { Resource } from "sst";

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
              KeyConditionExpression: "pk = :pkval",
              FilterExpression: `isPending = :isPendingVal AND requester ${filterConditionMap[status]} :requesterVal`,
              ExpressionAttributeValues: {
                  ":pkval": username,
                  ":isPendingVal": isPending,
                  ":requesterVal": username,
              },
          }
        : {
              TableName: Resource.RelationshipTable.name,
              KeyConditionExpression: "pk = :pkval",
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
