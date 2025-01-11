import { Resource } from "sst";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDbProvider } from "../utils/dynamo-client";
import { User, UserUpdate } from "../types";
import { getSalt, hashPassword } from "../utils/password";

export const getUserByUsername = async (username: string) => {
    const client = DynamoDbProvider.getInstance();

    const command = new GetCommand({
        TableName: Resource.UserTable.name,
        Key: { username: username },
    });

    const response = await client.send(command);
    return response;
};

export const createUser = async (
    username: string,
    name: string,
    email: string,
    password: string
) => {
    const client = DynamoDbProvider.getInstance();

    const salt = getSalt();
    const hash = await hashPassword(password, salt);

    const user: User = {
        username,
        name,
        email,
        profile: {
            image: `https://api.dicebear.com/9.x/initials/svg?seed=${name}`,
            width: 250,
            height: 250,
        },
        password: hash,
        salt,
        createdAt: Date.now(),
    };

    const command = new PutCommand({
        TableName: Resource.UserTable.name,
        Item: user,
        ConditionExpression: "attribute_not_exists(username)",
    });

    const response = await client.send(command);
    return response;
};

export const updateUser = async (updatedUser: UserUpdate) => {
    const client = DynamoDbProvider.getInstance();

    const command = new PutCommand({
        TableName: Resource.UserTable.name,
        Item: updatedUser,
    });

    const response = await client.send(command);
    return response;
};
