import { prisma } from "./prisma";

interface LogActionParams {
  actorId: string;
  actionType: string;
  targetEntity?: string;
  ipAddress: string;
}

export async function logSystemAction({
  actorId,
  actionType,
  targetEntity,
  ipAddress,
}: LogActionParams) {
  try {
    await prisma.systemAuditLog.create({
      data: {
        actor_id: actorId,
        action_type: actionType,
        target_entity: targetEntity || null,
        ip_address: ipAddress || "127.0.0.1",
      },
    });
  } catch (error) {
    console.error("Failed to write to SystemAuditLog:", error);
  }
}
