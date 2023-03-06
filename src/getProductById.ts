import { AttributeValue, DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { createResponse } from "./utils";

const getProductById: APIGatewayProxyHandler = async event => {
  console.info(`getProductById. Incoming event: ${JSON.stringify(event)}`);

  try {
    const { productId = "" } = event.pathParameters || {};

    const client = new DynamoDBClient({ region: "eu-west-1" });

    const commandParameters: Record<string, AttributeValue> = { ":id": { S: productId } };

    const command1 = new QueryCommand({ TableName: "products", ExpressionAttributeValues: commandParameters, KeyConditionExpression: "id = :id" });
    const command2 = new QueryCommand({ TableName: "stocks", ExpressionAttributeValues: commandParameters, KeyConditionExpression: "product_id = :id" });

    try {
      const [products, stocks] = await Promise.all([client.send(command1), client.send(command2)]);

      if (products.Count) {
        const product = products.Items[0];
        const count = parseInt(stocks.Count && stocks.Items[0].count.N);

        return createResponse({
          product: {
            id: product.id.S,
            title: product.title.S,
            description: product.description.S,
            price: parseFloat(product.price.N),
            count: count
          }
        });
      }

      return createResponse({ message: `Product '${productId}' not found` }, 404);
    }
    finally {
      client.destroy();
    }
  }
  catch (e) {
    console.error(`getProductById. Error: ${e.stack}`);

    return createResponse({ error: e.stack }, 500);
  }
};

export { getProductById as handler };
