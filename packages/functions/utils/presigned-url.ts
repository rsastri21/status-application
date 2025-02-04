import {
    HEIGHT_METADATA_HEADER,
    WIDTH_METADATA_HEADER,
} from "@status-application/core/utils/constants";
import { getUploadPresignedUrl } from "@status-application/core/utils/s3-utils";
import { Resource } from "sst";

export const generateUploadPresignedUrl = async (
    key: string,
    width: number,
    height: number
) => {
    const url = await getUploadPresignedUrl(Resource.Images.name, key, {
        [WIDTH_METADATA_HEADER]: String(width),
        [HEIGHT_METADATA_HEADER]: String(height),
    });
    return url;
};

export const generatePostPresignedUrls = async (
    keyPrefix: string,
    postId: string,
    primary: { width: number; height: number },
    secondary: { width: number; height: number }
) => {
    const primaryUrl = await getUploadPresignedUrl(
        Resource.Images.name,
        `${keyPrefix}/${postId}/primary`,
        {
            [WIDTH_METADATA_HEADER]: String(primary.width),
            [HEIGHT_METADATA_HEADER]: String(primary.height),
            postId,
        }
    );

    const secondaryUrl = await getUploadPresignedUrl(
        Resource.Images.name,
        `${keyPrefix}/${postId}/secondary`,
        {
            [WIDTH_METADATA_HEADER]: String(secondary.width),
            [HEIGHT_METADATA_HEADER]: String(primary.height),
            postId,
        }
    );

    return [primaryUrl, secondaryUrl] as const;
};
