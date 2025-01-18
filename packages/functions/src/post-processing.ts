import {
    getUserByUsername,
    updateUser,
} from "@status-application/core/queries/users";
import { User } from "@status-application/core/types";
import {
    HEIGHT_METADATA_HEADER,
    WIDTH_METADATA_HEADER,
} from "@status-application/core/utils/constants";
import { getObjectMetadata } from "@status-application/core/utils/s3-utils";
import { Handler } from "aws-lambda";
import { Resource } from "sst";

const handleProfileImageUpdate = async (key: string) => {
    /**
     * First retrieve object metadata so image dimensions can
     * be stored alongside the URL.
     */
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

export const handler: Handler = async (event, context) => {
    const objectKey: string | undefined = event.Records[0].s3?.object?.key;

    if (!objectKey) {
        return;
    }

    if (objectKey.includes("profile/picture")) {
        await handleProfileImageUpdate(objectKey);
    }
};
