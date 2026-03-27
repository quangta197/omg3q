import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE,
  sanitizeAdminNextPath,
  verifyAdminSessionToken,
} from "@/lib/admin-session";

export async function getAdminSessionFromCookies() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function requireAdminPageSession(nextPath?: string) {
  const session = await getAdminSessionFromCookies();

  if (session) {
    return session;
  }

  const sanitizedNextPath = sanitizeAdminNextPath(nextPath || ADMIN_HOME_PATH);
  redirect(`${ADMIN_LOGIN_PATH}?next=${encodeURIComponent(sanitizedNextPath)}&reason=auth`);
}
