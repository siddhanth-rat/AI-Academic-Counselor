import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { isIpBanned, checkIpRateLimit, banIp, checkUserCostBudget, clearRateLimitCache } from "../lib/rate-limit";
import { prisma } from "../lib/prisma";

// Mock the Prisma client
vi.mock("../lib/prisma", () => {
  const mockPrisma = {
    bannedIp: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    messageMetric: {
      aggregate: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
  };
});

const mockPrisma = prisma as any;

describe("Rate Limiter & API Cost Controls", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    clearRateLimitCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isIpBanned", () => {
    it("should return false when no ban exists for the IP", async () => {
      mockPrisma.bannedIp.findUnique.mockResolvedValue(null as any);
      
      const result = await isIpBanned("1.2.3.4");
      expect(result).toBe(false);
      expect(mockPrisma.bannedIp.findUnique).toHaveBeenCalledWith({
        where: { ip_address: "1.2.3.4" }
      });
    });

    it("should return true when a ban is active", async () => {
      mockPrisma.bannedIp.findUnique.mockResolvedValue({
        ip_address: "1.2.3.4",
        reason: "Abuse",
        expires_at: new Date(Date.now() + 10000)
      } as any);

      const result = await isIpBanned("1.2.3.4");
      expect(result).toBe(true);
    });

    it("should return false and delete the record when a ban is expired", async () => {
      mockPrisma.bannedIp.findUnique.mockResolvedValue({
        ip_address: "1.2.3.4",
        reason: "Abuse",
        expires_at: new Date(Date.now() - 10000) // Expired 10s ago
      } as any);
      mockPrisma.bannedIp.delete.mockResolvedValue({} as any);

      const result = await isIpBanned("1.2.3.4");
      expect(result).toBe(false);
      expect(mockPrisma.bannedIp.delete).toHaveBeenCalledWith({
        where: { ip_address: "1.2.3.4" }
      });
    });
  });

  describe("checkIpRateLimit", () => {
    it("should allow requests under the limit", async () => {
      const ip = "1.2.3.4";
      for (let i = 0; i < 5; i++) {
        const result = await checkIpRateLimit(ip);
        expect(result.allowed).toBe(true);
        expect(result.hits).toBe(i + 1);
        expect(result.isAbusive).toBe(false);
      }
    });

    it("should block requests exceeding the limit", async () => {
      const ip = "1.2.3.4";
      // Send 10 allowed requests
      for (let i = 0; i < 10; i++) {
        await checkIpRateLimit(ip);
      }

      // The 11th request should be blocked
      const blockedResult = await checkIpRateLimit(ip);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.hits).toBe(11);
      expect(blockedResult.isAbusive).toBe(false);
    });

    it("should auto-ban and block if abuse threshold is crossed", async () => {
      const ip = "1.2.3.4";
      mockPrisma.bannedIp.upsert.mockResolvedValue({} as any);

      // Send 30 requests (limit threshold is 10, abuse threshold is 30)
      for (let i = 0; i < 30; i++) {
        await checkIpRateLimit(ip);
      }

      // 31st request triggers abuse ban check
      const result = await checkIpRateLimit(ip);
      expect(result.allowed).toBe(false);
      expect(result.hits).toBe(31);
      expect(result.isAbusive).toBe(true);

      // Verify that database ban was triggered
      expect(mockPrisma.bannedIp.upsert).toHaveBeenCalled();
    });

    it("should reset sliding window after 1 minute", async () => {
      const ip = "1.2.3.4";

      // 10 hits at time = 0
      for (let i = 0; i < 10; i++) {
        await checkIpRateLimit(ip);
      }

      // 11th is blocked
      const blocked = await checkIpRateLimit(ip);
      expect(blocked.allowed).toBe(false);

      // Fast-forward 61 seconds
      vi.advanceTimersByTime(61 * 1000);

      // Requests should be allowed again
      const allowed = await checkIpRateLimit(ip);
      expect(allowed.allowed).toBe(true);
      expect(allowed.hits).toBe(1); // Old hits cleared, starts fresh
    });
  });

  describe("checkUserCostBudget", () => {
    it("should allow request if user cost is below limit", async () => {
      mockPrisma.messageMetric.aggregate.mockResolvedValue({
        _sum: { estimated_cost: 0.12 }
      } as any);

      const result = await checkUserCostBudget("user-1");
      expect(result.allowed).toBe(true);
      expect(result.totalCost).toBe(0.12);
    });

    it("should block request if user cost exceeds daily limit ($0.50)", async () => {
      mockPrisma.messageMetric.aggregate.mockResolvedValue({
        _sum: { estimated_cost: 0.55 }
      } as any);

      const result = await checkUserCostBudget("user-1");
      expect(result.allowed).toBe(false);
      expect(result.totalCost).toBe(0.55);
    });
  });
});
