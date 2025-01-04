import { Resource } from "sst";
import { getSessionIdFromToken } from "../utils/auth";
import { DynamoDbProvider } from "../utils/dynamo-client";
import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Session } from "../types";

const SESSION_EXPIRY_TIME = 14 * 24 * 60 * 60 * 1000; // 14 days

export const getSession = async (username: string, token: string) => {
    const client = DynamoDbProvider.getInstance();

    const sessionId = getSessionIdFromToken(token);

    const command = new GetCommand({
        TableName: Resource.SessionTable.name,
        Key: {
            username: username,
            sessionId: sessionId,
        },
    });

    const response = await client.send(command);
    return response;
};

export const createSession = async (username: string, token: string) => {
    const client = DynamoDbProvider.getInstance();

    const sessionId = getSessionIdFromToken(token);

    const session: Session = {
        username,
        sessionId,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRY_TIME,
    };

    const command = new PutCommand({
        TableName: Resource.SessionTable.name,
        Item: session,
    });

    const response = await client.send(command);
    return response;
};

export const deleteSession = async (username: string, token: string) => {
    const client = DynamoDbProvider.getInstance();

    const sessionId = getSessionIdFromToken(token);

    const command = new DeleteCommand({
        TableName: Resource.SessionTable.name,
        Key: {
            username: username,
            sessionId: sessionId,
        },
    });

    const response = await client.send(command);
    return response;
};
