import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config.js";

function getS3Client() {
  if (!config.b2KeyId || !config.b2ApplicationKey) {
    return null;
  }

  let endpoint = config.b2Endpoint;
  if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
    endpoint = `https://${endpoint}`;
  }

  return new S3Client({
    endpoint,
    region: "us-west-004", // Default B2 region or region from endpoint
    credentials: {
      accessKeyId: config.b2KeyId,
      secretAccessKey: config.b2ApplicationKey,
    },
    forcePathStyle: true,
  });
}

/**
 * Generates a presigned PUT URL for uploading a video directly to Backblaze B2.
 */
/**
 * Verifies that Backblaze B2 credentials and bucket are valid and accessible.
 */
export async function verifyB2Connection() {
  const s3Client = getS3Client();
  if (!s3Client) {
    console.log("ℹ️ [B2 Storage] B2 credentials not set. Operating in local storage mode.");
    return false;
  }

  try {
    const command = new HeadBucketCommand({ Bucket: config.b2BucketName });
    await s3Client.send(command);
    console.log(`✅ [B2 Storage] Successfully connected to Backblaze B2 bucket: "${config.b2BucketName}"`);
    return true;
  } catch (err) {
    console.warn(`⚠️ [B2 Storage Notice] Could not verify B2 bucket "${config.b2BucketName}": ${err.message}. Direct B2 uploads will fallback to local endpoint if needed.`);
    return false;
  }
}

export async function generatePresignedUploadUrl(filename, contentType = "video/webm", expiresIn = 900) {
  const s3Client = getS3Client();
  if (!s3Client) {
    return null;
  }

  const key = `interviews/${Date.now()}_${filename}`;
  const command = new PutObjectCommand({
    Bucket: config.b2BucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const endpointHost = config.b2Endpoint.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const fileUrl = `https://${endpointHost}/${config.b2BucketName}/${key}`;

  return { uploadUrl, fileUrl, key };
}

/**
 * Deletes an object from Backblaze B2 by key.
 */
export async function deleteB2Object(key) {
  const s3Client = getS3Client();
  if (!s3Client || !key) return false;

  try {
    const command = new DeleteObjectCommand({
      Bucket: config.b2BucketName,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (err) {
    console.error(`Failed to delete B2 object ${key}:`, err.message);
    return false;
  }
}

/**
 * Purges interview video objects in Backblaze B2 older than retentionDays (default: 3 days).
 */
export async function purgeOldB2Videos(retentionDays = 3) {
  const s3Client = getS3Client();
  if (!s3Client) return 0;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const listCommand = new ListObjectsV2Command({
      Bucket: config.b2BucketName,
      Prefix: "interviews/",
    });

    const response = await s3Client.send(listCommand);
    if (!response.Contents || response.Contents.length === 0) return 0;

    let purgedCount = 0;
    for (const item of response.Contents) {
      if (item.LastModified && new Date(item.LastModified) < cutoffDate) {
        const deleted = await deleteB2Object(item.Key);
        if (deleted) purgedCount++;
      }
    }
    return purgedCount;
  } catch (err) {
    console.error("Error during B2 auto-purge job:", err.message);
    return 0;
  }
}
