import {
    GetCommand,
    PutCommand,
    QueryCommand,
    QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { Image, Post } from "../types";
import { DynamoDbProvider } from "../utils/dynamo-client";
import { Resource } from "sst";
import { deleteDdbItem, updateDdbItem } from "../utils/ddb-utils";
import { deleteObject } from "../utils/s3-utils";

type PostKey = { username: string; postId: string };

export const getPostById = async (username: string, postId: string) => {
    const client = DynamoDbProvider.getInstance();

    const command = new GetCommand({
        TableName: Resource.PostTable.name,
        Key: {
            username,
            postId,
        },
    });

    const response = await client.send(command);
    return response;
};

export const getPostsForUserWithinRange = async (
    username: string,
    startTime: number,
    endTime: number = Date.now()
) => {
    const client = DynamoDbProvider.getInstance();

    const params: QueryCommandInput = {
        TableName: Resource.PostTable.name,
        KeyConditionExpression: "username = :pkVal",
        FilterExpression: "createdAt BETWEEN :startTimeVal AND :endTimeVal",
        ExpressionAttributeValues: {
            ":pkVal": username,
            ":startTimeVal": startTime,
            ":endTimeVal": endTime,
        },
    };

    const command = new QueryCommand(params);

    const response = await client.send(command);
    return response;
};

export const createEmptyPost = async (username: string) => {
    const client = DynamoDbProvider.getInstance();

    const postId = crypto.randomUUID();
    const post: Post = {
        username,
        postId,
        caption: "",
        likes: 0,
        reactions: [],
        comments: [],
        createdAt: Date.now(),
    };

    const command = new PutCommand({
        TableName: Resource.PostTable.name,
        Item: post,
    });

    await client.send(command);
    return postId;
};

export const attachImageToPost = async (
    username: string,
    postId: string,
    image: Image,
    type: "primaryImage" | "secondaryImage"
) => {
    return await updateDdbItem<Post, PostKey>(
        Resource.PostTable.name,
        { username, postId },
        { [type]: image }
    );
};

export const captionPost = async (
    username: string,
    postId: string,
    caption: string
) => {
    return await updateDdbItem<Post, PostKey>(
        Resource.PostTable.name,
        { username, postId },
        { caption }
    );
};

export const deletePost = async (username: string, postId: string) => {
    await deleteDdbItem<PostKey>(Resource.PostTable.name, {
        username,
        postId,
    });

    const keyPrefix = `images/${username}/posts/${postId}/`;
    await Promise.all(
        ["primary", "secondary"].map((type: string) =>
            deleteObject(Resource.Images.name, keyPrefix + type)
        )
    );
};
