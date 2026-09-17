import crypto from "node:crypto";
import { Router } from "express";
import dotenv from "dotenv";

dotenv.config();

const COOKIE_NAME = "doc_generator_session";
const SESSION_DURATION_MS = 5 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const loginAttempts = new Map();

function getConfig() {
  const password = process.env.APP_PASSWORD || "";
  const secret = process.env.SESSION_SECRET || "";
  if (!password || secret.length < 32) {
    throw new Error("APP_PASSWORD wajib diisi dan SESSION_SECRET minimal 32 karakter");
  }
  return { password, secret };
}

export function validateAuthConfig() {
  getConfig();
}

function safeEqual(left, right) {
  const leftHash = crypto.createHash("sha256").update(String(left)).digest();
  const rightHash = crypto.createHash("sha256").update(String(right)).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(now = Date.now()) {
  const { secret } = getConfig();
  const payload = Buffer.from(JSON.stringify({ exp: now + SESSION_DURATION_MS })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token, now = Date.now()) {
  try {
    const { secret } = getConfig();
    const [payload, signature] = String(token || "").split(".");
    if (!payload || !signature || !safeEqual(signature, sign(payload, secret))) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isFinite(data.exp) && data.exp > now;
  } catch {
    return false;
  }
}

function readCookie(req, name) {
  const cookies = String(req.headers.cookie || "").split(";");
  for (const cookie of cookies) {
    const [key, ...parts] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return "";
}

function cookieOptions(req, maxAgeSeconds) {
  const secure = req.secure || req.get("x-forwarded-proto") === "https";
  return [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
    `Max-Age=${maxAgeSeconds}`,
  ].filter(Boolean);
}

function clientKey(req) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isRateLimited(key, now = Date.now()) {
  const record = loginAttempts.get(key);
  if (!record || now - record.startedAt >= LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }
  return record.count >= MAX_LOGIN_ATTEMPTS;
}

function recordFailure(key, now = Date.now()) {
  const record = loginAttempts.get(key);
  if (!record || now - record.startedAt >= LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, startedAt: now });
    return;
  }
  record.count += 1;
}

export function requireAuth(req, res, next) {
  if (!verifySessionToken(readCookie(req, COOKIE_NAME))) {
    return res.status(401).json({ error: "Sesi tidak valid atau sudah berakhir" });
  }
  next();
}

export const authRouter = Router();

authRouter.get("/session", (req, res) => {
  res.json({ authenticated: verifySessionToken(readCookie(req, COOKIE_NAME)) });
});

authRouter.post("/login", (req, res) => {
  const key = clientKey(req);
  if (isRateLimited(key)) {
    return res.status(429).json({ error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." });
  }

  const { password: expectedPassword } = getConfig();
  if (!safeEqual(req.body?.password, expectedPassword)) {
    recordFailure(key);
    return res.status(401).json({ error: "Password salah" });
  }

  loginAttempts.delete(key);
  const token = createSessionToken();
  const cookie = cookieOptions(req, Math.floor(SESSION_DURATION_MS / 1000));
  cookie[0] = `${COOKIE_NAME}=${encodeURIComponent(token)}`;
  res.setHeader("Set-Cookie", cookie.join("; "));
  res.json({ authenticated: true, expiresInSeconds: SESSION_DURATION_MS / 1000 });
});

authRouter.post("/logout", (req, res) => {
  res.setHeader("Set-Cookie", cookieOptions(req, 0).join("; "));
  res.json({ authenticated: false });
});
