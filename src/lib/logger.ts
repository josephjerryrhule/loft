import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const LOG_DIR = process.env.LOG_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

async function ensureLogDir() {
  try {
    await fs.promises.mkdir(LOG_DIR, { recursive: true });
  } catch (e) {
    // best effort
    console.error("Failed to create log directory:", e);
  }
}

function formatLine(level: string, msg: string, meta?: any) {
  const ts = new Date().toISOString();
  let metaStr = "";
  if (meta !== undefined) {
    try {
      metaStr = typeof meta === "string" ? meta : JSON.stringify(meta);
    } catch (e) {
      metaStr = String(meta);
    }
    metaStr = ` | ${metaStr}`;
  }
  return `[${ts}] [${level}] ${msg}${metaStr}\n`;
}

export enum ActionType {
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    REGISTER = "REGISTER",
    CREATE_ORDER = "CREATE_ORDER",
    UPDATE_USER = "UPDATE_USER",
    DELETE_USER = "DELETE_USER",
    SUBSCRIPTION = "SUBSCRIPTION",
    SUBSCRIPTION_COMMISSION = "SUBSCRIPTION_COMMISSION",
    COMMISSION_APPROVED = "COMMISSION_APPROVED",
    ADMIN_APPROVE_COMMISSION = "ADMIN_APPROVE_COMMISSION",
    PAYOUT_REQUESTED = "PAYOUT_REQUESTED",
    PAYOUT_RECEIVED = "PAYOUT_RECEIVED",
    PAYOUT_APPROVED = "PAYOUT_APPROVED",
}

export async function writeLog(level: string, message: string, meta?: any) {
  await ensureLogDir();
  const line = formatLine(level, message, meta);
  try {
    await fs.promises.appendFile(LOG_FILE, line, { encoding: "utf8" });
  } catch (e) {
    console.error("Failed to write to log file:", e);
  }
  if (level === "ERROR") console.error(line);
  else console.log(line);
}

/**
 * Records an activity to the DB (if available) and writes a human readable log line.
 */
export async function logActivity(
  userId: string | null,
  actionType: string,
  actionDetails?: any
) {
  const detailsStr = actionDetails === undefined ? undefined : (typeof actionDetails === "string" ? actionDetails : JSON.stringify(actionDetails));
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        actionType,
        actionDetails: detailsStr,
      },
    });
  } catch (e) {
    // record DB write failures to file
    await writeLog("ERROR", `Failed to write activity log to DB for user ${userId}`, String(e));
  }

  await writeLog("INFO", `Activity ${actionType} for user ${userId}`, actionDetails);
}
