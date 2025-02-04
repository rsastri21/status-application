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
