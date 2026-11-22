import { Prisma } from "@/src/generated/prisma/client";

export async function withDatabaseRetry<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "ETIMEDOUT") {
      return operation();
    }
    throw error;
  }
}
