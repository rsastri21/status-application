import {
    GetCommand,
    PutCommand,
    QueryCommand,
    QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { Comment, Image, Post, Reaction, Reply } from "../types";
import { DynamoDbProvider } from "../utils/dynamo-client";
import { Resource } from "sst";
import { deleteDdbItem, getDdbItem, updateDdbItem } from "../utils/ddb-utils";
import { deleteObject } from "../utils/s3-utils";
import { tryCatch } from "../utils/try-catch";

type PostKey = { username: string; postId: string };

const getPost = async (username: string, postId: string) => {
    const { data, error } = await tryCatch(
        getDdbItem<PostKey>(Resource.PostTable.name, { username, postId })
    );

    if (error) {
        throw new Error("Failed to get post.");
    }

    if (!data.Item) {
        throw new Error("Post does not exist.");
    }

    return data.Item as Post;
};

export const getPostById = async (username: string, postId: string) => {
    return await getDdbItem<PostKey>(Resource.PostTable.name, {
        username,
        postId,
    });
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

export const likePost = async (
    username: string,
    postId: string,
    type: "like" | "dislike"
) => {
    const { data: post, error } = await tryCatch(getPost(username, postId));

    if (error) {
        throw new Error(error.message);
    }

    const likes = type === "like" ? post.likes + 1 : post.likes - 1;

    return await updateDdbItem<Post, PostKey>(
        Resource.PostTable.name,
        { username, postId },
        { likes }
    );
};

export const commentPost = async (
    username: string,
    postId: string,
    author: string,
    content: string
) => {
    const { data: post, error } = await tryCatch(getPost(username, postId));

    if (error) {
        throw new Error(error.message);
    }

    const comment: Comment = {
        id: post.comments.length + 1,
        author,
        content,
    };

    const comments: Comment[] = [...post.comments, comment];

    return await updateDdbItem<Post, PostKey>(
        Resource.PostTable.name,
        { username, postId },
        { comments }
    );
};

export const reactToPost = async (
    username: string,
    postId: string,
    author: string,
    content: string
) => {
    const { data: post, error } = await tryCatch(getPost(username, postId));

    if (error) {
        throw new Error(error.message);
    }

    const reaction: Reaction = {
        emoji: content,
        author,
    };

    const reactions: Reaction[] = [...post.reactions, reaction];

    return await updateDdbItem<Post, PostKey>(
        Resource.PostTable.name,
        { username, postId },
        { reactions }
    );
};

export const replyToComment = async (
    username: string,
    postId: string,
    author: string,
    commentId: number,
    content: string
) => {
    const { data: post, error } = await tryCatch(getPost(username, postId));

    if (error) {
        throw new Error(error.message);
    }

    const commentForReply = post.comments?.find(
        (comment) => comment.id === commentId
    );

    if (!commentForReply) {
        throw new Error("Comment does not exist.");
    }

    const reply: Reply = {
        id: (commentForReply.replies?.length ?? 0) + 1,
        author,
        reply: content,
    };
    const replies = [...(commentForReply.replies ?? []), reply];

    const newComments = post.comments.map((comment) => {
        if (comment.id === commentId) {
            return {
                ...comment,
                replies,
            };
        }
        return comment;
    });

    return await updateDdbItem<Post, PostKey>(
        Resource.PostTable.name,
        { username, postId },
        { comments: newComments }
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
