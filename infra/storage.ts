import { users } from "./database";

// Create an S3 bucket
export const bucket = new sst.aws.Bucket("Images", {
    access: "cloudfront",
});

bucket.notify({
    notifications: [
        {
            name: "PostProcessing",
            function: {
                handler: "packages/functions/src/post-processing.handler",
                link: [users, bucket],
            },
            events: ["s3:ObjectCreated:*"],
        },
    ],
});

export const router = new sst.aws.Router("Router", {
    routes: {
        "/*": {
            bucket: bucket,
        },
    },
});
