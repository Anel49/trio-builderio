import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || "us-east-2";

console.log("[S3] Initializing S3Client with:");
console.log("[S3] Region:", region);
console.log("[S3] Bucket: lendit-files");
console.log(
  "[S3] AWS_ACCESS_KEY_ID:",
  accessKeyId ? `✓ Set (${accessKeyId.substring(0, 5)}...)` : "✗ Missing",
);
console.log(
  "[S3] AWS_SECRET_ACCESS_KEY:",
  secretAccessKey ? "✓ Set" : "✗ Missing",
);

if (!accessKeyId || !secretAccessKey) {
  console.error(
    "[S3] ERROR: AWS credentials not found! Image uploads will fail.",
  );
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

const bucketName = "lendit-files";

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
    console.log("[S3] Generating presigned URL for:", key);
    console.log("[S3] Using bucket:", bucketName);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    console.log("[S3] Generated presigned URL successfully");
    console.log("[S3] URL preview:", presignedUrl.substring(0, 300) + "...");

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
  return `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-2"}.amazonaws.com/${key}`;
}

/**
 * Generate a unique S3 key for a listing image
 * @param listingId - The listing ID
 * @param imageNumber - The sequential image number (1, 2, 3, etc.)
 * @param fileExtension - The file extension (e.g., "jpg", "png")
 * @returns A unique S3 key
 */
export function generateListingImageS3Key(
  listingId: number,
  imageNumber: number,
  fileExtension: string,
): string {
  // Ensure image number is padded to 3 digits (001, 002, etc.)
  const paddedNumber = String(imageNumber).padStart(3, "0");

  // Normalize the file extension
  const ext = fileExtension.toLowerCase().replace(/^\./, "");

  // Create key: listings/{listingId}/{listingId}_img_{imageNumber}.{ext}
  return `listings/${listingId}/${listingId}_img_${paddedNumber}.${ext}`;
}

/**
 * Generate an S3 key for a user profile picture
 * @param userId - The user ID
 * @param originalFileName - The original file name
 * @returns An S3 key for the user's profile picture
 */
export function generateUserProfilePictureS3Key(
  userId: number,
  originalFileName: string,
): string {
  // Remove special characters from filename and sanitize
  const sanitized = originalFileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .toLowerCase();

  // Create a key: users/{userId}/profile_{filename}
  return `users/${userId}/profile_${sanitized}`;
}

/**
 * Legacy function - kept for backward compatibility
 * Now deprecated - use generateListingImageS3Key instead
 */
export function generateS3Key(
  listingId: number,
  imageNumber: number,
  fileExtension: string,
): string {
  return generateListingImageS3Key(listingId, imageNumber, fileExtension);
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
 * Delete all objects under a prefix (e.g., all images in a listing folder)
 * @param prefix - The S3 prefix (e.g., "listings/123/")
 * @returns The number of objects deleted
 */
export async function deleteS3Prefix(prefix: string): Promise<number> {
  try {
    console.log("[S3] Deleting all objects under prefix:", prefix);

    // List all objects under the prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const listResult = await s3Client.send(listCommand);
    const objects = listResult.Contents || [];

    if (objects.length === 0) {
      console.log("[S3] No objects found under prefix:", prefix);
      return 0;
    }

    console.log("[S3] Found", objects.length, "objects to delete under prefix:", prefix);

    // Delete all objects
    for (const obj of objects) {
      if (obj.Key) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: obj.Key,
        });
        await s3Client.send(deleteCommand);
        console.log("[S3] Deleted:", obj.Key);
      }
    }

    console.log("[S3] Successfully deleted", objects.length, "objects under prefix:", prefix);
    return objects.length;
  } catch (error) {
    console.error("[S3] Error deleting objects under prefix:", prefix, error);
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
