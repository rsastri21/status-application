import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { S3ClientProvider } from "./s3-client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const getUploadPresignedUrl = (
    bucket: string,
    key: string,
    width: number,
    height: number
) => {
    const client = S3ClientProvider.getInstance();
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Metadata: {
            "x-amz-meta-width": String(width),
            "x-amz-meta-height": String(height),
        },
    });
    return getSignedUrl(client, command, { expiresIn: 300 });
};

export const getObjectMetadata = async (bucket: string, key: string) => {
    const client = S3ClientProvider.getInstance();

    const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    const response = await client.send(command);
    return response;
};
