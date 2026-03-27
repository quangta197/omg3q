import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "omg3q_admin_session";
export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_HOME_PATH = "/admin/accounts";

const DEFAULT_ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;

export type AdminSession = {
  userId: string;
  email: string;
  expiresAt: number;
};

type SerializedAdminSession = {
  e: string;
  u: string;
  x: number;
};

function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getAdminAllowedEmails() {
  return (process.env.ADMIN_ALLOWED_EMAILS || "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);
}

function isAdminEmailAllowed(email: string) {
  return getAdminAllowedEmails().includes(normalizeEmail(email));
}

function getAdminSessionSecret() {
  return (process.env.ADMIN_SESSION_SECRET || "").trim();
}

function getAdminSessionTtlSeconds() {
  const configuredValue = Number(process.env.ADMIN_SESSION_TTL_SECONDS);

  if (Number.isFinite(configuredValue) && configuredValue >= 900) {
    return configuredValue;
  }

  return DEFAULT_ADMIN_SESSION_TTL_SECONDS;
}

function getCookieMaxAge(expiresAt: number) {
  const secondsRemaining = expiresAt - Math.floor(Date.now() / 1000);
  return Math.max(0, secondsRemaining);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function importSigningKey(secret: string, usages: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages
  );
}

function serializeSession(session: AdminSession): SerializedAdminSession {
  return {
    e: normalizeEmail(session.email),
    u: session.userId,
    x: session.expiresAt,
  };
}

function deserializeSession(payload: SerializedAdminSession): AdminSession | null {
  if (!payload?.e || !payload?.u || !payload?.x) {
    return null;
  }

  const email = normalizeEmail(payload.e);
  const expiresAt = Number(payload.x);

  if (!email || !payload.u || !Number.isFinite(expiresAt)) {
    return null;
  }

  if (expiresAt <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  if (!isAdminEmailAllowed(email)) {
    return null;
  }

  return {
    email,
    userId: payload.u,
    expiresAt,
  };
}

export function getAdminAuthSetupIssues() {
  const issues: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!getSupabasePublishableKey()) {
    issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (getAdminAllowedEmails().length === 0) {
    issues.push("ADMIN_ALLOWED_EMAILS");
  }

  const sessionSecret = getAdminSessionSecret();

  if (!sessionSecret) {
    issues.push("ADMIN_SESSION_SECRET");
  } else if (sessionSecret.length < 32) {
    issues.push("ADMIN_SESSION_SECRET (min 32 ký tự)");
  }

  return issues;
}

export function formatAdminAuthSetupMessage() {
  return `Admin auth chưa cấu hình đầy đủ: ${getAdminAuthSetupIssues().join(", ")}.`;
}

export function sanitizeAdminNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/admin")) {
    return ADMIN_HOME_PATH;
  }

  if (value.startsWith(ADMIN_LOGIN_PATH)) {
    return ADMIN_HOME_PATH;
  }

  return value;
}

export async function authenticateAdminCredentials(
  email: string,
  password: string
): Promise<AdminSession> {
  const issues = getAdminAuthSetupIssues();

  if (issues.length > 0) {
    throw new Error(formatAdminAuthSetupMessage());
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    getSupabasePublishableKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    throw new Error("Email hoặc mật khẩu admin không đúng.");
  }

  const userEmail = normalizeEmail(data.user?.email || "");

  if (!data.user || !userEmail || !isAdminEmailAllowed(userEmail)) {
    throw new Error("Tài khoản này không có quyền truy cập admin CMS.");
  }

  return {
    userId: data.user.id,
    email: userEmail,
    expiresAt: Math.floor(Date.now() / 1000) + getAdminSessionTtlSeconds(),
  };
}

export async function createAdminSessionToken(session: AdminSession) {
  const secret = getAdminSessionSecret();

  if (!secret) {
    throw new Error("Thiếu ADMIN_SESSION_SECRET để ký phiên admin.");
  }

  const payload = serializeSession(session);
  const payloadJson = JSON.stringify(payload);
  const payloadValue = bytesToBase64Url(new TextEncoder().encode(payloadJson));
  const signingKey = await importSigningKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign(
    "HMAC",
    signingKey,
    new TextEncoder().encode(payloadValue)
  );

  return `${payloadValue}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAdminSessionToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const secret = getAdminSessionSecret();

  if (!secret) {
    return null;
  }

  const [payloadValue, signatureValue] = token.split(".");

  if (!payloadValue || !signatureValue) {
    return null;
  }

  try {
    const verificationKey = await importSigningKey(secret, ["verify"]);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      verificationKey,
      base64UrlToBytes(signatureValue),
      new TextEncoder().encode(payloadValue)
    );

    if (!isValid) {
      return null;
    }

    const payloadJson = new TextDecoder().decode(base64UrlToBytes(payloadValue));
    const payload = JSON.parse(payloadJson) as SerializedAdminSession;

    return deserializeSession(payload);
  } catch {
    return null;
  }
}

export function applyAdminSessionCookie(
  response: NextResponse,
  token: string,
  session: AdminSession
) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getCookieMaxAge(session.expiresAt),
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function ensureSameOrigin(request: NextRequest) {
  if (
    request.method === "GET" ||
    request.method === "HEAD" ||
    request.method === "OPTIONS"
  ) {
    return null;
  }

  const origin = request.headers.get("origin");

  if (!origin) {
    return NextResponse.json(
      {
        success: false,
        message: "Thiếu Origin header cho request admin.",
      },
      { status: 403 }
    );
  }

  const requestOrigin = new URL(request.url).origin;

  if (origin !== requestOrigin) {
    return NextResponse.json(
      {
        success: false,
        message: "Từ chối request admin từ origin không hợp lệ.",
      },
      { status: 403 }
    );
  }

  return null;
}

export async function authorizeAdminApiRequest(request: NextRequest) {
  const issues = getAdminAuthSetupIssues();

  if (issues.length > 0) {
    return NextResponse.json(
      {
        success: false,
        message: formatAdminAuthSetupMessage(),
      },
      { status: 503 }
    );
  }

  const sameOriginResponse = ensureSameOrigin(request);

  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifyAdminSessionToken(token);

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Phiên admin không hợp lệ hoặc đã hết hạn.",
      },
      { status: 401 }
    );
  }

  return session;
}
