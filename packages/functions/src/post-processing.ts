import { attachImageToPost } from "@status-application/core/queries/posts";
import {
    getUserByUsername,
    updateUser,
} from "@status-application/core/queries/users";
import { Image, User } from "@status-application/core/types";
import {
    HEIGHT_METADATA_HEADER,
    WIDTH_METADATA_HEADER,
} from "@status-application/core/utils/constants";
import { getObjectMetadata } from "@status-application/core/utils/s3-utils";
import { Handler } from "aws-lambda";
import { Resource } from "sst";

const getImageDimensions = async (key: string) => {
    let width: number | undefined, height: number | undefined;
    try {
        const response = await getObjectMetadata(Resource.Images.name, key);
        const metadata = response.Metadata;

        if (
            metadata &&
            metadata[WIDTH_METADATA_HEADER] &&
            metadata[HEIGHT_METADATA_HEADER]
        ) {
            width = Number(metadata[WIDTH_METADATA_HEADER]);
            height = Number(metadata[HEIGHT_METADATA_HEADER]);
        }
    } catch (error) {
        console.error("Could not retrieve object metadata.", error);
    }

    return [width, height] as const;
};

const handleProfileImageUpdate = async (key: string) => {
    /**
     * First retrieve object metadata so image dimensions can
     * be stored alongside the URL.
     */
    const [width, height] = await getImageDimensions(key);

    if (!width || !height) {
        return;
    }

    /**
     * Extract username from object key for DDB update.
     */
    const username: string = key.split("/")[1];
    let user: User | undefined;
    try {
        const response = await getUserByUsername(username);

        if (!response.Item) {
            throw new Error("Failed to find user for profile picture update.");
        }
        user = response.Item as User;
    } catch (error) {
        console.error("Could not find user for profile picture update.", error);
    }

    if (!user) {
        return;
    }

    /**
     * Update the user with the new profile picture information.
     */
    try {
        const profile = {
            image: `${Resource.Router.url}/${key}`,
            width,
            height,
        };
        const response = await updateUser({
            ...user,
            profile: profile,
        });
    } catch (error) {
        console.error("Could not update profile picture.", error);
    }
};

const handlePostImageUpdate = async (key: string) => {
    /**
     * First retrieve object metadata so image dimensions can
     * be stored alongside the URL.
     */
    const [width, height] = await getImageDimensions(key);

    if (!width || !height) {
        return;
    }

    /**
     * Extract fields from object key for DDB update.
     */
    const keys = key.split("/");
    const username: string = keys[1];
    const postId: string = keys[3];
    const type: "primaryImage" | "secondaryImage" = key.endsWith("primary")
        ? "primaryImage"
        : "secondaryImage";

    /**
     * Attach image to post
     */
    try {
        const image: Image = {
            image: `${Resource.Router.url}/${key}`,
            width,
            height,
        };
        const response = await attachImageToPost(username, postId, image, type);
    } catch (error) {
        console.error("Could not attach image to post.", error);
    }
};

export const handler: Handler = async (event, context) => {
    const objectKey: string | undefined = event.Records[0].s3?.object?.key;

    if (!objectKey) {
        return;
    }

    const profileKeyPattern: RegExp = /^images\/[^\/]+\/profile\/picture$/;

    const postKeyPattern: RegExp =
        /^images\/[^\/]+\/posts\/[^\/]+\/(primary|secondary)$/;

    if (profileKeyPattern.test(objectKey)) {
        await handleProfileImageUpdate(objectKey);
    } else if (postKeyPattern.test(objectKey)) {
        await handlePostImageUpdate(objectKey);
    }
};
