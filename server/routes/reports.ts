import type { Request, Response } from "express";
import { pool } from "./db";
import { copyS3WebpImagesAndGetUrls } from "../lib/s3";

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

    // Copy listing images to reports folder if this is a listing report
    let copiedCount = 0;
    if (report_for === "listing" && reported_id) {
      try {
        const sourcePrefix = `listings/${reported_id}/`;
        const destPrefix = `reports/${reported_id}/`;
        console.log(
          "[createReport] Copying listing images from:",
          sourcePrefix,
          "to:",
          destPrefix,
        );
        copiedCount = await copyS3Prefix(sourcePrefix, destPrefix);
        console.log("[createReport] Copied", copiedCount, "images");
      } catch (error) {
        console.warn(
          "[createReport] Warning: Failed to copy S3 images:",
          error,
        );
        // Continue with report creation even if S3 copy fails
      }
    }

    // Build the reported_content_snapshot JSON
    const reportedContentSnapshot = listing_data
      ? {
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
          bucket_url: `https://lendit-files.s3.us-east-2.amazonaws.com/reports/${reported_id}`,
        }
      : null;

    // Build the report_reasons JSON
    const reportReasonsJson = {
      report_reasons: report_reasons,
    };

    // Insert the report into the database
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
       returning id, reported_by_id, report_for, reported_id, created_at`,
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

    res.json({
      ok: true,
      message: "Report submitted successfully",
      reportId,
      copiedImages: copiedCount,
    });
  } catch (error: any) {
    console.error("[createReport] Error:", error);
    res
      .status(500)
      .json({ ok: false, error: String(error?.message || error) });
  }
}
