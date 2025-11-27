import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
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
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

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
