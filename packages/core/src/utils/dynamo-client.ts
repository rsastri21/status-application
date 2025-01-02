import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export class DynamoDbProvider {
    private static dynamoDbClient: DynamoDBDocumentClient | undefined;

    private constructor() {}

    public static getInstance() {
        if (!DynamoDbProvider.dynamoDbClient) {
            const client = new DynamoDBClient();
            const dynamoDbClient = DynamoDBDocumentClient.from(client);
            DynamoDbProvider.dynamoDbClient = dynamoDbClient;
        }
        return DynamoDbProvider.dynamoDbClient;
    }
}
