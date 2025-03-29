import { getFriends } from "@status-application/core/queries/friends";
import { Post, Relationship } from "@status-application/core/types";
import { tryCatch } from "@status-application/core/utils/try-catch";
import { getMidnightEpoch } from "./get-midnight-date";
import { getPostsForUserWithinRange } from "@status-application/core/queries/posts";

type FeedResponse = {
    visible: boolean;
    posts: Post[];
};

/**
 * If requested from time is within the current day,
 * the feed will be hidden from the user.
 */
const shouldHidePosts = async (username: string, from: number) => {
    const currentDayMidnight = getMidnightEpoch();

    if (from < currentDayMidnight) {
        return false;
    }

    const { data, error } = await tryCatch(
        getPostsForUserWithinRange(username, from)
    );

    if (error) {
        if (error.name === "ValidationException") {
            return true;
        }
        throw new Error("Could not get user posts", error);
    }

    const userPostCount = data.Count ?? 0;

    if (userPostCount !== 0) {
        return false;
    }

    return true;
};

const filterAndOrderPosts = (posts: Post[]) => {
    const validPosts = posts.filter(
        (post) => post.primaryImage && post.secondaryImage
    );
    const orderedPosts = validPosts.toSorted(
        (postA, postB) => postA.createdAt - postB.createdAt
    );
    return orderedPosts;
};

/**
 * Generates a feed of posts from a user's friends for the given time range.
 * @param username User to generate feed for
 */
export const generateFriendsFeed = async (
    username: string,
    from: number,
    to: number | undefined
): Promise<FeedResponse> => {
    // This can throw but it can be handled by Lambda function layer
    const hidden = await shouldHidePosts(username, from);
    const { data, error } = await tryCatch(getFriends(username));

    if (error) {
        if (error.name === "ValidationException") {
            return {
                visible: hidden,
                posts: [],
            };
        }
        throw new Error(`Could not get friends for user: ${username}`);
    }

    const friends =
        (data.Items as Relationship[])?.map(
            (friend: Relationship) => friend.friend
        ) ?? [];

    const postsResponse = await Promise.all(
        friends.map((friend) => {
            return getPostsForUserWithinRange(friend, from, to ?? Date.now());
        })
    );
    const posts = postsResponse.flatMap(
        (postResponse) => (postResponse.Items ?? []) as Post[]
    );

    return {
        visible: hidden,
        posts: filterAndOrderPosts(posts),
    };
};

export const generateUserFeed = async (
    username: string,
    from: number,
    to = Date.now()
): Promise<FeedResponse> => {
    const postsResponse = await getPostsForUserWithinRange(username, from, to);
    const posts = (postsResponse.Items ?? []) as Post[];

    return {
        visible: true,
        posts: filterAndOrderPosts(posts),
    };
};
