import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || "us-east-2";
const bucketNameEnv = process.env.AWS_S3_BUCKET_NAME;

console.log("[S3] Initializing S3Client with:");
console.log("[S3] Region:", region);
console.log("[S3] Bucket:", bucketNameEnv);
console.log("[S3] AWS_ACCESS_KEY_ID:", accessKeyId ? `✓ Set (${accessKeyId.substring(0, 5)}...)` : "✗ Missing");
console.log("[S3] AWS_SECRET_ACCESS_KEY:", secretAccessKey ? "✓ Set" : "✗ Missing");

if (!accessKeyId || !secretAccessKey) {
  console.error("[S3] ERROR: AWS credentials not found! Image uploads will fail.");
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || "lendit-listing-images";

/**
 * Generate a presigned URL for uploading a file to S3
 * @param key - The S3 object key (file path)
 * @param contentType - The MIME type of the file
 * @param expiresIn - Number of seconds until the URL expires (default: 3600 = 1 hour)
 * @returns The presigned URL
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600,
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      ChecksumAlgorithm: "CRC32",
    } as any);

    let presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    // Strip checksum parameters that AWS SDK adds but would cause signature mismatches
    const urlObj = new URL(presignedUrl);
    urlObj.searchParams.delete("x-amz-checksum-crc32");
    urlObj.searchParams.delete("x-amz-checksum-sha1");
    urlObj.searchParams.delete("x-amz-checksum-sha256");
    urlObj.searchParams.delete("x-amz-sdk-checksum-algorithm");
    presignedUrl = urlObj.toString();

    console.log("[S3] Generated presigned URL for key:", key);
    console.log("[S3] URL includes:", presignedUrl.substring(0, 200) + "...");

    return presignedUrl;
  } catch (error) {
    console.error("[S3] Error generating presigned upload URL:", error);
    throw error;
  }
}

/**
 * Generate a presigned URL for downloading/viewing a file from S3
 * @param key - The S3 object key (file path)
 * @param expiresIn - Number of seconds until the URL expires (default: 3600 = 1 hour)
 * @returns The presigned URL
 */
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600,
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    return presignedUrl;
  } catch (error) {
    console.error("[S3] Error generating presigned download URL:", error);
    throw error;
  }
}

/**
 * Get the public S3 URL for an object
 * Note: This only works if the object is publicly readable
 * @param key - The S3 object key (file path)
 * @returns The public S3 URL
 */
export function getS3Url(key: string): string {
  return `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
}

/**
 * Generate a unique S3 key for an uploaded file
 * @param listingId - The listing ID
 * @param originalFileName - The original file name
 * @param timestamp - Optional timestamp for uniqueness
 * @returns A unique S3 key
 */
export function generateS3Key(
  listingId: number,
  originalFileName: string,
  timestamp: number = Date.now(),
): string {
  // Remove special characters from filename and sanitize
  const sanitized = originalFileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .toLowerCase();

  // Create a unique key: listings/{listingId}/{timestamp}_{filename}
  return `listings/${listingId}/${timestamp}_${sanitized}`;
}

/**
 * Delete an object from S3
 * @param key - The S3 object key (file path)
 * @returns True if the delete was successful
 */
export async function deleteS3Object(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
    console.log("[S3] Deleted object:", key);
    return true;
  } catch (error) {
    console.error("[S3] Error deleting object:", key, error);
    throw error;
  }
}

/**
 * Extract S3 key from a public S3 URL
 * @param url - The S3 URL
 * @returns The S3 key or null if invalid
 */
export function extractS3KeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Handle path-style S3 URLs: https://bucket.s3.region.amazonaws.com/key
    // Handle virtual-hosted-style URLs: https://bucket.s3.amazonaws.com/key
    let path = urlObj.pathname;

    // Remove leading slash if present
    if (path.startsWith("/")) {
      path = path.slice(1);
    }

    return path || null;
  } catch {
    return null;
  }
}

/**
 * Validate S3 URL format
 * @param url - The URL to validate
 * @returns True if the URL is a valid S3 URL
 */
export function isValidS3Url(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Check if it's an S3 URL (either path-style or virtual-hosted-style)
    return (
      urlObj.hostname.includes("s3") &&
      (urlObj.hostname.includes(".amazonaws.com") ||
        urlObj.hostname.includes("amazonaws.com"))
    );
  } catch {
    return false;
  }
}
