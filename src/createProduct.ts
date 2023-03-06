import { DynamoDBClient, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { randomUUID } from "crypto";
import { createResponse } from "./utils";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

const createProduct: APIGatewayProxyHandler = async event => {
  console.info(`createProduct. Incoming event: ${JSON.stringify(event)}`);

  try {
    const id = randomUUID();
    const product = JSON.parse(event.body) as Product;
    const client = new DynamoDBClient({ region: "eu-west-1" });

    const command = new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: "products",
            Item: {
              id: { S: id },
              title: { S: product.title },
              description: { S: product.description },
              price: { N: String(product.price) }
            }
          }
        },
        {
          Put: {
            TableName: "stocks",
            Item: {
              product_id: { S: id },
              count: { N: String(product.count) }
            }
          }
        }
      ]
    });

    try {
      await client.send(command);
    }
    finally {
      client.destroy();
    }

    return createResponse({
      product: {
        id: id,
        ...product
      }
    });
  }
  catch (e) {
    console.error(`createProduct. Error: ${e.stack}`);

    return createResponse({ error: e.stack }, 500);
  }
};

export { createProduct as handler };
