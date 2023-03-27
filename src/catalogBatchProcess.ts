import { DynamoDBClient, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { SQSHandler } from "aws-lambda";
import { randomUUID } from "crypto";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

const catalogBatchProcess: SQSHandler = async event => {
  console.info(`catalogBatchProcess. Incoming event: ${JSON.stringify(event)}`);

  try {
    const clientDynamoDb = new DynamoDBClient({ region: "eu-west-1" });
    const clientSns = new SNSClient({ region: "eu-west-1" });

    try {
      await Promise.all(event.Records.map(async record => {
        const id = randomUUID();
        const product = JSON.parse(record.body) as Product;

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

        await clientDynamoDb.send(command);
      }));

      await clientSns.send(new PublishCommand({
        TopicArn: process.env.SNS_ARN,
        Subject: "New Products Added",
        Message: `${event.Records.length} new product(s) added`
      }));
    }
    finally {
      clientDynamoDb.destroy();
      clientSns.destroy();
    }
  }
  catch (e) {
    console.error(`catalogBatchProcess. Error: ${e.stack}`);
  }
};

export { catalogBatchProcess as handler };
