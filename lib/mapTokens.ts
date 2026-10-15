import crypto from "crypto";

// HMAC-signed, expiring tokens for the restaurant-map feature. Used for the
// "Approve for map" link in the founder signup email (so clicking from the
// inbox works WITHOUT a logged-in session) and for the follow-up edit page.
//
// Two purposes, never interchangeable:
//   "approve" — single-use, carried in the email. Expires in 30 days.
//   "edit"    — issued after approval so the founder can edit the restaurant's
//               map info without logging in. Expires in 24 hours.
//
// Secret: a dedicated MAP_TOKEN_SECRET if set, otherwise the Supabase service
// role key (always present server-side, high entropy, never shipped to the
// client). Both are server-only, so tokens can never be forged from the web.

const SECRET =
  process.env.MAP_TOKEN_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.CRON_SECRET ||
  "";

export type TokenPurpose = "approve" | "edit";

type Payload = {
  p: TokenPurpose;
  rid: string; // restaurant id
  exp: number; // expiry, epoch ms
  n?: string; // optional single-use nonce (approve tokens only)
};

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(str: string): Buffer {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(data: string): string {
  return b64url(crypto.createHmac("sha256", SECRET).update(data).digest());
}

export function signToken(args: {
  purpose: TokenPurpose;
  restaurantId: string;
  ttlMs: number;
  nonce?: string;
}): string {
  const payload: Payload = {
    p: args.purpose,
    rid: args.restaurantId,
    exp: Date.now() + args.ttlMs,
  };
  if (args.nonce) payload.n = args.nonce;
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string, purpose: TokenPurpose): Payload | null {
  if (!token || !SECRET) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  // Constant-time signature comparison.
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload: Payload;
  try {
    payload = JSON.parse(fromB64url(body).toString("utf8"));
  } catch {
    return null;
  }

  if (payload.p !== purpose) return null;
  if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
  if (!payload.rid) return null;
  return payload;
}

export function makeNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export const APPROVE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const EDIT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
