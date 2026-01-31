import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Helper function to get family member IDs for shared data
export async function getFamilyUserIds(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyId: true },
  });

  if (!user?.familyId) {
    return [userId]; // No family, return only current user
  }

  // Get all users in the same family
  const familyMembers = await prisma.user.findMany({
    where: { familyId: user.familyId },
    select: { id: true },
  });

  return familyMembers.map((m) => m.id);
}
