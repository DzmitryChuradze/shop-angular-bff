import { APIGatewayProxyHandler } from "aws-lambda";
import products from "../data/products.json";
import { createResponse } from "./utils";

const getProducts: APIGatewayProxyHandler = async event => {
  console.info(`getProducts. Incoming event: ${JSON.stringify(event)}`);

  try {
    return createResponse(products);
  }
  catch (e) {
    console.error(`getProducts. Error: ${e.stack}`);

    return createResponse({ error: e.stack }, 500);
  }
};

export { getProducts as handler };
