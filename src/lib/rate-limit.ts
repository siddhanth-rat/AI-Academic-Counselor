import { prisma } from "./prisma";

// In-memory sliding window cache for IP rate limiting
// Map<ip_address, timestamp_ms[]>
const ipRequestCache = new Map<string, number[]>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const LIMIT_HITS = 10;       // Max 10 requests per minute
const ABUSE_HITS = 30;       // Exceeding 30 requests per minute flags as abuse
const BAN_DURATION_MS = 24 * 60 * 60 * 1000; // Ban for 24 hours

const DAILY_COST_LIMIT = 0.50; // $0.50 maximum spend per user per day

/**
 * Checks if a client IP is currently banned in the database.
 * If a ban exists but has expired, it is automatically removed.
 */
export async function isIpBanned(ip: string): Promise<boolean> {
  const ban = await prisma.bannedIp.findUnique({
    where: { ip_address: ip }
  });

  if (!ban) return false;

  const now = new Date();
  if (ban.expires_at > now) {
    return true; // Still active
  }

  // Ban expired, remove it asynchronously to clean up
  prisma.bannedIp.delete({ where: { ip_address: ip } }).catch((err) => {
    console.error(`[Rate Limiter] Failed to delete expired ban for ${ip}:`, err);
  });

  return false;
}

/**
 * Bans a client IP by inserting or updating a row in the BannedIp table.
 */
export async function banIp(ip: string, reason: string): Promise<void> {
  const expiresAt = new Date(Date.now() + BAN_DURATION_MS);
  
  await prisma.bannedIp.upsert({
    where: { ip_address: ip },
    update: { reason, expires_at: expiresAt },
    create: { ip_address: ip, reason, expires_at: expiresAt }
  });

  console.warn(`[Rate Limiter] IP ${ip} has been banned for 24 hours. Reason: ${reason}`);
}

/**
 * Enforces sliding window rate limit for an IP in memory.
 * Returns the hit count and whether the request is allowed.
 * Automatically triggers an IP ban if abuse thresholds are crossed.
 */
export async function checkIpRateLimit(ip: string): Promise<{ allowed: boolean; hits: number; isAbusive: boolean }> {
  const now = Date.now();
  
  // Get timestamps for this IP
  let timestamps = ipRequestCache.get(ip) || [];
  
  // Filter out timestamps older than the sliding window
  timestamps = timestamps.filter(ts => now - ts < WINDOW_MS);
  
  // Record current request timestamp
  timestamps.push(now);
  ipRequestCache.set(ip, timestamps);

  const hits = timestamps.length;
  const isAbusive = hits > ABUSE_HITS;
  const allowed = hits <= LIMIT_HITS;

  if (isAbusive) {
    // Automatically ban the IP for abuse in the database
    await banIp(ip, `API Abuse: Exceeded sliding window rate limit with ${hits} hits/min.`);
  }

  return { allowed, hits, isAbusive };
}

/**
 * Calculates a user's total estimated API spend in the last 24 hours.
 * Verifies if it exceeds the daily budget threshold of $0.50.
 */
export async function checkUserCostBudget(userId: string): Promise<{ allowed: boolean; totalCost: number }> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await prisma.messageMetric.aggregate({
    where: {
      message: {
        session: {
          user_id: userId
        },
        created_at: {
          gte: oneDayAgo
        }
      }
    },
    _sum: {
      estimated_cost: true
    }
  });

  const totalCost = Number(result._sum.estimated_cost || 0);
  const allowed = totalCost < DAILY_COST_LIMIT;

  return { allowed, totalCost };
}

/**
 * Helper to clear the in-memory cache (primarily used in test suites).
 */
export function clearRateLimitCache() {
  ipRequestCache.clear();
}
