import type { Request, Response } from "express";
import { pool } from "./db";
import {
  copyS3WebpImagesAndGetUrls,
  copyS3ObjectAndGetUrl,
  downloadAndUploadImageToS3,
} from "../lib/s3";

export async function createReport(req: Request, res: Response) {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    const {
      report_for,
      reported_id,
      report_reasons,
      report_details,
      listing_data,
    } = req.body;

    // Validate required fields
    if (!report_for || !reported_id || !report_reasons || !Array.isArray(report_reasons)) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields: report_for, reported_id, report_reasons",
      });
    }

    if (report_for !== "listing" && report_for !== "user") {
      return res.status(400).json({
        ok: false,
        error: "Invalid report_for value. Must be 'listing' or 'user'",
      });
    }

    // Build the reported_content_snapshot JSON based on report type
    let reportedContentSnapshot: any = null;

    if (report_for === "listing" && listing_data) {
      reportedContentSnapshot = {
        title: listing_data.title || null,
        description: listing_data.description || null,
        latitude:
          typeof listing_data.latitude === "number"
            ? listing_data.latitude
            : null,
        longitude:
          typeof listing_data.longitude === "number"
            ? listing_data.longitude
            : null,
        addons: listing_data.addons
          ? listing_data.addons.map((addon: any) => ({
              item: addon.item,
              style: addon.style || null,
            }))
          : [],
        bucket_urls: [],
      };
    } else if (report_for === "user") {
      // For user reports, fetch user data from database
      try {
        const userResult = await pool.query(
          `select name, email, username, avatar_url from users where id = $1`,
          [reported_id],
        );
        const reportedUser = userResult.rows[0];

        if (reportedUser) {
          reportedContentSnapshot = {
            name: reportedUser.name || null,
            email: reportedUser.email || null,
            username: reportedUser.username || null,
            bucket_url: null,
          };
        }
      } catch (error) {
        console.warn("[createReport] Failed to fetch user data:", error);
      }
    }

    // Build the report_reasons JSON
    const reportReasonsJson = {
      report_reasons: report_reasons,
    };

    // Insert the report into the database first
    const result = await pool.query(
      `insert into reports (
        reported_by_id,
        report_for,
        reported_id,
        reported_content_snapshot,
        report_reasons,
        report_details,
        status,
        created_at
      ) values ($1, $2, $3, $4, $5, $6, $7, now())
       returning id, number, reported_by_id, report_for, reported_id, created_at`,
      [
        userId,
        report_for,
        reported_id,
        JSON.stringify(reportedContentSnapshot),
        JSON.stringify(reportReasonsJson),
        report_details || null,
        "submitted",
      ],
    );

    const reportId = result.rows[0]?.id;
    const reportNumber = result.rows[0]?.number;

    // Copy images to reports folder with report ID in the path
    if (reportId && reported_id && reportedContentSnapshot) {
      try {
        const destPrefix = `reports/report_${reportId}_${report_for}_${reported_id}/`;

        if (report_for === "listing") {
          // For listings, copy all WEBP images from the listing folder
          const sourcePrefix = `listings/${reported_id}/`;
          console.log(
            "[createReport] Copying listing images from:",
            sourcePrefix,
            "to:",
            destPrefix,
          );
          const bucketUrls = await copyS3WebpImagesAndGetUrls(
            sourcePrefix,
            destPrefix,
          );
          console.log("[createReport] Copied", bucketUrls.length, "WEBP images");

          // Update the report with the bucket URLs
          if (bucketUrls.length > 0) {
            await pool.query(
              `update reports set reported_content_snapshot = jsonb_set(
                reported_content_snapshot,
                '{bucket_urls}',
                $1::jsonb
              ) where id = $2`,
              [JSON.stringify(bucketUrls), reportId],
            );
          }
        } else if (report_for === "user") {
          // For users, copy or download their avatar from avatar_url
          const userResult = await pool.query(
            `select avatar_url from users where id = $1`,
            [reported_id],
          );
          const user = userResult.rows[0];

          if (user && user.avatar_url) {
            try {
              let bucketUrl: string | null = null;

              // Check if avatar is already in our S3 bucket
              if (user.avatar_url.includes("lendit-files.s3")) {
                console.log(
                  "[createReport] Copying S3 user avatar from:",
                  user.avatar_url,
                  "to:",
                  destPrefix,
                );
                bucketUrl = await copyS3ObjectAndGetUrl(
                  user.avatar_url,
                  destPrefix,
                );
              } else {
                // Avatar is from external source (OAuth provider), download and upload it
                console.log(
                  "[createReport] Downloading external user avatar from:",
                  user.avatar_url,
                  "to:",
                  destPrefix,
                );
                bucketUrl = await downloadAndUploadImageToS3(
                  user.avatar_url,
                  destPrefix,
                );
              }

              console.log("[createReport] Processed user avatar:", bucketUrl);

              // Update the report with the bucket URL
              if (bucketUrl) {
                await pool.query(
                  `update reports set reported_content_snapshot = jsonb_set(
                    reported_content_snapshot,
                    '{bucket_url}',
                    $1::jsonb
                  ) where id = $2`,
                  [JSON.stringify(bucketUrl), reportId],
                );
              }
            } catch (error) {
              console.warn(
                "[createReport] Warning: Failed to process user avatar:",
                error,
              );
              // Continue - report is already created with user data
            }
          }
        }
      } catch (error) {
        console.warn(
          "[createReport] Warning: Failed to process report images:",
          error,
        );
        // Continue - report is already created
      }
    }

    // Set report_number to REP-{number}
    if (reportId && reportNumber) {
      await pool.query(
        `update reports set report_number = 'REP-' || $1 where id = $2`,
        [reportNumber, reportId],
      );
    }

    res.json({
      ok: true,
      message: "Report submitted successfully",
      reportId,
    });
  } catch (error: any) {
    console.error("[createReport] Error:", error);
    res
      .status(500)
      .json({ ok: false, error: String(error?.message || error) });
  }
}
