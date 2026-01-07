import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }

  const user = (req.session as any).user;
  if (!user || !user.admin) {
    return res.status(403).json({ ok: false, error: "Admin access required" });
  }

  next();
}

export function requireModeratorOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log("[requireModeratorOrAdmin] Session:", {
    hasSession: !!req.session,
    userId: req.session?.userId,
    sessionId: req.sessionID,
    headers: {
      cookie: req.headers.cookie ? "[present]" : "[missing]",
    },
  });

  if (!req.session || !req.session.userId) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }

  const user = (req.session as any).user;
  if (!user || (!user.admin && !user.moderator)) {
    return res.status(403).json({
      ok: false,
      error: "Admin or Moderator access required",
    });
  }

  next();
}

export function requireModeratorOrAdminOptional(req: Request) {
  if (!req.session || !req.session.userId) {
    return false;
  }

  const user = (req.session as any).user;
  return Boolean(user && (user.admin || user.moderator));
}

export function isAdmin(req: Request): boolean {
  if (!req.session || !req.session.userId) {
    return false;
  }

  const user = (req.session as any).user;
  return Boolean(user && user.admin);
}

export function isModerator(req: Request): boolean {
  if (!req.session || !req.session.userId) {
    return false;
  }

  const user = (req.session as any).user;
  return Boolean(user && user.moderator);
}
