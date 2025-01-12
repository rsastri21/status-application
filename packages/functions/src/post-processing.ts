import { Handler } from "aws-lambda";

export const handler: Handler = async (event, context) => {
    console.log("params", event.Records[0].requestParameters);
    console.log("s3", event.Records[0].s3);
};
