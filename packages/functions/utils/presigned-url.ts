import { getUploadPresignedUrl } from "@status-application/core/utils/s3-utils";
import { Resource } from "sst";

export const generateUploadPresignedUrl = async (
    key: string,
    width: number,
    height: number
) => {
    const url = await getUploadPresignedUrl(
        Resource.Images.name,
        key,
        width,
        height
    );
    return url;
};
