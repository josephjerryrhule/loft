import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: any };

async function getClientIp(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    const realIp = headersList.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
    return null;
  } catch (e) {
    return null;
  }
}

export const prisma =
  (globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // Connection pooling configuration
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }).$extends({
    query: {
      activityLog: {
        async create({ args, query }) {
          if (!args.data.ipAddress) {
            const ip = await getClientIp();
            if (ip) {
              args.data.ipAddress = ip;
            }
          }
          return query(args);
        },
        async createMany({ args, query }) {
          const ip = await getClientIp();
          if (ip) {
            if (Array.isArray(args.data)) {
              for (const item of args.data) {
                if (!item.ipAddress) {
                  item.ipAddress = ip;
                }
              }
            } else if (args.data) {
              if (!(args.data as any).ipAddress) {
                (args.data as any).ipAddress = ip;
              }
            }
          }
          return query(args);
        }
      }
    }
  })) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
