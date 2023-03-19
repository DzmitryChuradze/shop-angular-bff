import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import csv from "csv-parser";

const importFileParser = async event => {
  console.info(`importFileParser. Incoming event: ${JSON.stringify(event)}`);

  try {
    const client = new S3Client({ region: "eu-west-1" });

    try {
      await Promise.all(event.Records.map(async record => {
        console.info(`Reading '${record.s3.object.key}'...`);

        const getCommand = new GetObjectCommand({
          Bucket: record.s3.bucket.name,
          Key: record.s3.object.key
        });

        const result = await client.send(getCommand);
        const stream = result.Body as NodeJS.ReadableStream;

        console.info(`Reading '${record.s3.object.key}' finished`);

        console.info(`Parsing '${record.s3.object.key}'...`);

        await new Promise((resolve, reject) => {
          stream.pipe(csv())
            .on("data", console.log)
            .on("error", reject)
            .on("end", resolve);
        });

        console.info(`Parsing '${record.s3.object.key}' finished`);

        const copyToPath = record.s3.object.key.replace(/^uploaded\//, "parsed/");

        console.info(`Copying '${record.s3.object.key}' to '${copyToPath}'...`);

        const copyCommand = new CopyObjectCommand({
          Bucket: record.s3.bucket.name,
          CopySource: record.s3.object.key,
          Key: copyToPath
        });

        await client.send(copyCommand);

        console.info(`Copying '${record.s3.object.key}' to '${copyToPath}' finished`);

        console.info(`Deleting '${record.s3.object.key}'...`);

        const deleteCommand = new DeleteObjectCommand({
          Bucket: record.s3.bucket.name,
          Key: record.s3.object.key
        });

        await client.send(deleteCommand);

        console.info(`Deleting '${record.s3.object.key}' finished`);
      }));
    }
    finally {
      client.destroy();
    }
  }
  catch (e) {
    console.error(`importFileParser. Error: ${e.stack}`);
  }
};

export { importFileParser as handler };
