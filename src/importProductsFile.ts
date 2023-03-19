import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyHandler } from "aws-lambda";
import { createResponse } from "./utils";

const importProductsFile: APIGatewayProxyHandler = async event => {
  console.info(`importProductsFile. Incoming event: ${JSON.stringify(event)}`);

  try {
    const catalogName = event.queryStringParameters.name;
    const catalogPath = `uploaded/${catalogName}`;

    const client = new S3Client({ region: "eu-west-1" });

    try {
      const command = new PutObjectCommand({ Bucket: "rs-school-app-bucket-upload", Key: catalogPath });

      const url = await getSignedUrl(client, command, { expiresIn: 60 });

      return createResponse(url);
    }
    finally {
      client.destroy();
    }
  }
  catch (e) {
    console.error(`importProductsFile. Error: ${e.stack}`);

    return createResponse({ error: e.stack }, 500);
  }
};

export { importProductsFile as handler };
