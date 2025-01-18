import { getObjectMetadata } from "@status-application/core/utils/s3-utils";
import { Handler } from "aws-lambda";
import { Resource } from "sst";

const handleProfileImageUpdate = async (key: string) => {
    /**
     * First retrieve object metadata so image dimensions can
     * be stored alongside the URL.
     */
    let width: number, height: number;
    try {
        const response = await getObjectMetadata(Resource.Images.name, key);
        const metadata = response.Metadata;

        if (
            metadata &&
            metadata["x-amz-meta-width"] &&
            metadata["x-amz-meta-height"]
        ) {
            width = Number(metadata["x-amz-meta-width"]);
            height = Number(metadata["x-amz-meta-height"]);
        } else {
            return;
        }
    } catch (error) {
        console.error("Could not retrieve object metadata.", error);
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
