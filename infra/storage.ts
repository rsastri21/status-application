import { posts, users } from "./database";

// Create an S3 bucket
export const bucket = new sst.aws.Bucket("Images", {
    access: "cloudfront",
});

export const router = new sst.aws.Router("Router", {
    routes: {
        "/*": {
            bucket: bucket,
        },
    },
});

bucket.notify({
    notifications: [
        {
            name: "PostProcessing",
            function: {
                handler: "packages/functions/src/post-processing.handler",
                link: [users, posts, bucket, router],
            },
            events: ["s3:ObjectCreated:*"],
        },
    ],
});
