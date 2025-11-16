import type { Request, Response } from "express";
import { pool } from "./db";

export async function createListingReview(req: Request, res: Response) {
  try {
    const { listing_id, reviewer_id, rating, comment } = req.body || {};

    if (!listing_id || !reviewer_id) {
      return res.status(400).json({
        ok: false,
        error: "listing_id and reviewer_id are required",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        ok: false,
        error: "rating must be between 1 and 5",
      });
    }

    if (
      !comment ||
      typeof comment !== "string" ||
      comment.trim().length === 0
    ) {
      return res.status(400).json({
        ok: false,
        error: "comment is required",
      });
    }

    const result = await pool.query(
      `insert into listing_reviews (listing_id, reviewer_id, rating, comment)
       values ($1, $2, $3, $4)
       returning id, listing_id, reviewer_id, rating, comment, created_at`,
      [listing_id, reviewer_id, rating, comment.trim()],
    );

    const review = result.rows[0];
    res.json({ ok: true, review });
  } catch (error: any) {
    console.error("[createListingReview] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function getListingReviews(req: Request, res: Response) {
  try {
    const listingId = Number((req.params as any)?.id);
    if (!listingId || Number.isNaN(listingId)) {
      return res.status(400).json({ ok: false, error: "invalid listing id" });
    }

    const result = await pool.query(
      `select lr.id, lr.listing_id, lr.reviewer_id, u.name as reviewer_name,
              u.username, u.avatar_url, lr.rating, lr.comment, lr.helpful_count, lr.created_at
       from listing_reviews lr
       join users u on u.id = lr.reviewer_id
       where lr.listing_id = $1
       order by lr.created_at desc
       limit 100`,
      [listingId],
    );

    const reviews = result.rows.map((r: any) => ({
      id: r.id,
      listingId: r.listing_id,
      reviewerId: r.reviewer_id,
      reviewerName: r.reviewer_name,
      reviewerUsername: r.username,
      avatar: r.avatar_url,
      rating: r.rating ? Number(r.rating) : null,
      comment: r.comment,
      helpfulCount: r.helpful_count,
      createdAt: r.created_at,
    }));

    res.json({ ok: true, reviews });
  } catch (error: any) {
    console.error("[getListingReviews] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function updateListingReviewHelpful(req: Request, res: Response) {
  try {
    const reviewId = Number((req.params as any)?.id);
    if (!reviewId || Number.isNaN(reviewId)) {
      return res.status(400).json({ ok: false, error: "invalid review id" });
    }

    const result = await pool.query(
      `update listing_reviews set helpful_count = helpful_count + 1 where id = $1 returning id, helpful_count`,
      [reviewId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "review not found" });
    }

    res.json({
      ok: true,
      helpfulCount: result.rows[0].helpful_count,
    });
  } catch (error: any) {
    console.error("[updateListingReviewHelpful] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function updateListingReview(req: Request, res: Response) {
  try {
    const reviewId = Number((req.params as any)?.id);
    if (!reviewId || Number.isNaN(reviewId)) {
      return res.status(400).json({ ok: false, error: "invalid review id" });
    }

    const { rating, comment } = req.body || {};

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        ok: false,
        error: "rating must be between 1 and 5",
      });
    }

    if (
      !comment ||
      typeof comment !== "string" ||
      comment.trim().length === 0
    ) {
      return res.status(400).json({
        ok: false,
        error: "comment is required",
      });
    }

    const result = await pool.query(
      `update listing_reviews set rating = $1, comment = $2, updated_at = now() where id = $3 returning id, rating, comment, updated_at`,
      [rating, comment.trim(), reviewId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "review not found" });
    }

    res.json({ ok: true, review: result.rows[0] });
  } catch (error: any) {
    console.error("[updateListingReview] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function deleteListingReview(req: Request, res: Response) {
  try {
    const reviewId = Number((req.params as any)?.id);
    if (!reviewId || Number.isNaN(reviewId)) {
      return res.status(400).json({ ok: false, error: "invalid review id" });
    }

    const result = await pool.query(
      `delete from listing_reviews where id = $1`,
      [reviewId],
    );

    res.json({ ok: true, deleted: result.rowCount || 0 });
  } catch (error: any) {
    console.error("[deleteListingReview] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
