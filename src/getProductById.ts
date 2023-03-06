import { APIGatewayProxyHandler } from "aws-lambda";
import products from "../data/products.json";
import { createResponse } from "./utils";

const getProductById: APIGatewayProxyHandler = async event => {
  console.info(`getProductById. Incoming event: ${JSON.stringify(event)}`);

  try {
    const { productId = "" } = event.pathParameters || {};
    const product = products.find(product => product.id == productId);

    if (product) {
      return createResponse({ product: product });
    }

    return createResponse({ message: `Product '${productId}' not found` }, 404);
  }
  catch (e) {
    console.error(`getProductById. Error: ${e.stack}`);

    return createResponse({ error: e.stack }, 500);
  }
};

export { getProductById as handler };
