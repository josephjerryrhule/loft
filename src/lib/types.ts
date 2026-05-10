export enum Role {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  AFFILIATE = "AFFILIATE",
  PARENT = "PARENT"
}

/** @deprecated Use Role.PARENT instead */
export const CUSTOMER = Role.PARENT;

export enum UserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING = "PENDING"
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED"
}

