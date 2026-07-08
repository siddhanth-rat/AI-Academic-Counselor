import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveUnavailableEscalations } from "../lib/escalation";
import { prisma } from "../lib/prisma";

// Mock the Prisma client
vi.mock("../lib/prisma", () => {
  const mockPrisma = {
    session: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return {
    prisma: mockPrisma,
  };
});

const mockPrisma = vi.mocked(prisma);

describe("resolveUnavailableEscalations", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    
    // Default mock implementation of transaction to pass the prisma instance as tx
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      return await callback(prisma);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should process escalations outside counselor hours (e.g. 10 PM IST)", async () => {
    // Set time to 10:00 PM IST (16:30 UTC)
    const mockTime = new Date("2026-07-08T16:30:00Z");
    vi.setSystemTime(mockTime);

    // Mock pending sessions
    const mockSessions = [{ id: "session-1" }, { id: "session-2" }];
    mockPrisma.session.findMany.mockResolvedValue(mockSessions as any);
    mockPrisma.session.updateMany.mockResolvedValue({ count: 1 } as any);
    mockPrisma.message.create.mockResolvedValue({} as any);

    await resolveUnavailableEscalations();

    // Verify findMany was called with correct filter (no limit check outside hours)
    expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
      where: {
        status: "PENDING_ESCALATION",
      },
      select: { id: true },
    });

    // Check transaction operations
    expect(mockPrisma.session.updateMany).toHaveBeenCalledTimes(2);
    expect(mockPrisma.message.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.message.create).toHaveBeenNthCalledWith(1, {
      data: {
        session_id: "session-1",
        sender_type: "SYSTEM",
        content: "Our counselors are available from 9 AM to 5:30 PM IST. Kindly contact them during those hours. For any other queries, your AI counselor is available to help."
      }
    });
  });

  it("should process escalations inside counselor hours (e.g. 12 PM IST) if pending for > 5 minutes", async () => {
    // Set time to 12:00 PM IST (06:30 UTC)
    const mockTime = new Date("2026-07-08T06:30:00Z");
    vi.setSystemTime(mockTime);

    mockPrisma.session.findMany.mockResolvedValue([] as any);

    await resolveUnavailableEscalations();

    // Verify findMany was called with 5-minute timeout window
    expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
      where: {
        status: "PENDING_ESCALATION",
        updated_at: {
          lte: new Date(mockTime.getTime() - 5 * 60 * 1000),
        },
      },
      select: { id: true },
    });
  });
});
