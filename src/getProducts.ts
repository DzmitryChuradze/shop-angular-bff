import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { createResponse } from "./utils";

const getProducts: APIGatewayProxyHandler = async event => {
  console.info(`getProducts. Incoming event: ${JSON.stringify(event)}`);

  try {
    const client = new DynamoDBClient({ region: "eu-west-1" });
    const command1 = new ScanCommand({ TableName: "products" });
    const command2 = new ScanCommand({ TableName: "stocks" });

    try {
      const [products, stocks] = await Promise.all([client.send(command1), client.send(command2)]);

      return createResponse(products.Items.map(product => ({
        id: product.id.S,
        title: product.title.S,
        description: product.description.S,
        price: parseFloat(product.price.N),
        count: parseInt(stocks.Items.find(stock => stock.product_id.S == product.id.S)?.count.N)
      })));
    }
    finally {
      client.destroy();
    }
  }
  catch (e) {
    console.error(`getProducts. Error: ${e.stack}`);

    return createResponse({ error: e.stack }, 500);
  }
};

export { getProducts as handler };
