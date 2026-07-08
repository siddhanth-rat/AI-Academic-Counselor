import { NextRequest } from "next/server";

/**
 * Validates the Origin header of a state-mutating request.
 * Helps prevent Cross-Site Request Forgery (CSRF) attacks.
 */
export function verifyCsrf(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) {
    // Non-browser or direct server-to-server requests might not have Origin headers.
    // Modern browsers always append it for POST/PUT/DELETE requests.
    return true; 
  }

  const host = req.headers.get("host");
  if (!host) return false;

  try {
    const originUrl = new URL(origin);
    const expectedHost = host.split(":")[0];
    
    // Check if origin matches host hostname
    if (originUrl.hostname === expectedHost) {
      return true;
    }

    // Check custom configured public URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      const appOrigin = new URL(appUrl).origin;
      if (originUrl.origin === appOrigin) {
        return true;
      }
    }
  } catch (err) {
    console.error("[CSRF] Failed to parse origin/host URL:", err);
    return false;
  }

  return false;
}
