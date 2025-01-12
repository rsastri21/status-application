import { S3Client } from "@aws-sdk/client-s3";

export class S3ClientProvider {
    private static s3Client: S3Client | undefined;

    private constructor() {}

    public static getInstance() {
        if (!S3ClientProvider.s3Client) {
            const client = new S3Client();
            S3ClientProvider.s3Client = client;
        }
        return S3ClientProvider.s3Client;
    }
}
