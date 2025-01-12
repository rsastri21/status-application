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
