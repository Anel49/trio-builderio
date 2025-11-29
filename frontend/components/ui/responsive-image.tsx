import React from "react";

interface ResponsiveImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  webpSrc?: string;
  alt: string;
  fallbackSrc?: string;
}

/**
 * Responsive image component that displays WEBP format when available
 * Falls back to original format for browsers that don't support WEBP
 */
export const ResponsiveImage = React.forwardRef<
  HTMLImageElement,
  ResponsiveImageProps
>(({ src, webpSrc, alt, fallbackSrc, className, ...props }, ref) => {
  // If no webpSrc is provided, just use the original src
  if (!webpSrc) {
    return (
      <img ref={ref} src={src} alt={alt} className={className} {...props} />
    );
  }

  return (
    <picture style={{ display: "contents" }}>
      {/* Use WEBP format first for modern browsers */}
      <source srcSet={webpSrc} type="image/webp" />
      {/* Fall back to original format */}
      <img
        ref={ref}
        src={src || fallbackSrc}
        alt={alt}
        className={className}
        {...props}
      />
    </picture>
  );
});

ResponsiveImage.displayName = "ResponsiveImage";

/**
 * Convert an S3 URL to its WEBP equivalent
 * Assumes WEBP files follow the same naming pattern with .webp extension
 * E.g., "listings/1/1_img_001.jpg" -> "listings/1/1_img_001.webp"
 */
export function getWebpUrl(s3Url: string): string | null {
  if (!s3Url) return null;

  // Replace the file extension with .webp
  const match = s3Url.match(/^(.+)\.([a-zA-Z0-9]+)(\?.*)?$/);
  if (!match) return null;

  const [, basePath, , query] = match;
  return basePath + ".webp" + (query || "");
}
