import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { S3EventRecord, S3Handler } from "aws-lambda";
import csv from "csv-parser";

const getObject = async (record: S3EventRecord, client: S3Client): Promise<NodeJS.ReadableStream> => {
  try {
    console.info(`Reading '${record.s3.object.key}'...`);

    const getCommand = new GetObjectCommand({
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key
    });

    const result = await client.send(getCommand);
    const stream = result.Body as NodeJS.ReadableStream;

    console.info(`Reading '${record.s3.object.key}' finished`);

    return stream;
  }
  catch (e) {
    console.error(`Unable to copy file. Error: ${e.stack}`);
  }
}

const copyObject = async (record: S3EventRecord, client: S3Client) => {
  try {
    const copyToPath = record.s3.object.key.replace(/^uploaded\//, "parsed/");

    console.info(`Copying '${record.s3.object.key}' to '${copyToPath}'...`);

    const copyCommand = new CopyObjectCommand({
      Bucket: record.s3.bucket.name,
      CopySource: record.s3.object.key,
      Key: copyToPath
    });

    await client.send(copyCommand);

    console.info(`Copying '${record.s3.object.key}' to '${copyToPath}' finished`);
  }
  catch (e) {
    console.error(`Unable to copy file. Error: ${e.stack}`);
  }
}

const deleteObject = async (record: S3EventRecord, client: S3Client) => {
  try {
    console.info(`Deleting '${record.s3.object.key}'...`);

    const deleteCommand = new DeleteObjectCommand({
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key
    });

    await client.send(deleteCommand);

    console.info(`Deleting '${record.s3.object.key}' finished`);
  }
  catch (e) {
    console.error(`Unable to delete file. Error: ${e.stack}`);
  }
}

const processCsv = async (record: S3EventRecord, stream: NodeJS.ReadableStream, clientSqs: SQSClient) => {
  try {
    console.info(`Parsing '${record.s3.object.key}'...`);

    const sendToSqsTasks = new Array<Promise<any>>();

    await new Promise((resolve, reject) => {
      stream.pipe(csv())
        .on("data", sendToSqs(clientSqs, sendToSqsTasks))
        .on("error", reject)
        .on("end", resolve);
    });

    await Promise.all(sendToSqsTasks);

    console.info(`Parsing '${record.s3.object.key}' finished`);
  }
  catch (e) {
    console.error(`Unable to parse record. Error: ${e.stack}`);
  }
}

const sendToSqs = (clientSqs: SQSClient, sendToSqsTasks: Array<Promise<any>>) => data => {
  sendToSqsTasks.push(clientSqs.send(new SendMessageCommand({ QueueUrl: process.env.SQS_URL, MessageBody: JSON.stringify(data) })));
};

const importFileParser: S3Handler = async event => {
  console.info(`importFileParser. Incoming event: ${JSON.stringify(event)}`);

  try {
    const clientS3 = new S3Client({ region: "eu-west-1" });
    const clientSqs = new SQSClient({ region: "eu-west-1" });

    try {
      await Promise.all(event.Records.map(async record => {
        const stream = await getObject(record, clientS3);

        if (stream) {
          await processCsv(record, stream, clientSqs);
          await copyObject(record, clientS3);
          await deleteObject(record, clientS3);
        }
      }));
    }
    finally {
      clientS3.destroy();
      clientSqs.destroy();
    }
  }
  catch (e) {
    console.error(`importFileParser. Error: ${e.stack}`);
  }
};

export { importFileParser as handler };
