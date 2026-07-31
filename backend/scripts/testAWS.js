const path = require('path');
const dotenv = require('dotenv');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const {
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    CLOUDTRAIL_LOG_BUCKET
  } = process.env;

  const missing = [
    ['AWS_ACCESS_KEY_ID', AWS_ACCESS_KEY_ID],
    ['AWS_SECRET_ACCESS_KEY', AWS_SECRET_ACCESS_KEY],
    ['AWS_REGION', AWS_REGION],
    ['CLOUDTRAIL_LOG_BUCKET', CLOUDTRAIL_LOG_BUCKET]
  ].filter(([, value]) => !value).map(([key]) => key);

  if (missing.length > 0) {
    process.stderr.write(`FAILED\nMissing required environment variables: ${missing.join(', ')}\n`);
    process.exitCode = 1;
    return;
  }

  const client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
  });

  try {
    const response = await client.send(new ListObjectsV2Command({
      Bucket: CLOUDTRAIL_LOG_BUCKET,
      MaxKeys: 5
    }));

    const keys = (response.Contents || []).map((item) => item.Key).filter(Boolean);

    process.stdout.write(`Bucket: ${CLOUDTRAIL_LOG_BUCKET}\n`);
    if (keys.length === 0) {
      process.stdout.write('No objects found in bucket.\n');
    } else {
      process.stdout.write('First 5 object keys:\n');
      keys.forEach((key, index) => {
        process.stdout.write(`${index + 1}. ${key}\n`);
      });
    }
    process.stdout.write('SUCCESS\n');
  } catch (error) {
    process.stderr.write('FAILED\n');
    process.stderr.write(`${error.name || 'Error'}: ${error.message}\n`);
    process.exitCode = 1;
  }
}

main();
