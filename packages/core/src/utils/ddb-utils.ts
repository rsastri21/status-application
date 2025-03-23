import {
    UpdateCommand,
    UpdateCommandInput,
    UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDbProvider } from "./dynamo-client";

export const updateDdbItem = async <T, K extends Record<string, any>>(
    tableName: string,
    key: K,
    updateItem: Partial<T>
): Promise<UpdateCommandOutput> => {
    if (Object.keys(updateItem).length === 0) {
        throw new Error("At least one property key required.");
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, T[keyof T]> = {};

    Object.entries(updateItem).forEach(([property, value], index) => {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = property;
        expressionAttributeValues[attrValue] = value as T[keyof T];
    });

    const params: UpdateCommandInput = {
        TableName: tableName,
        Key: key,
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
    };

    const client = DynamoDbProvider.getInstance();
    const command = new UpdateCommand(params);

    const response = await client.send(command);
    return response;
};
