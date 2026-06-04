export const ROLE: {
  ADMIN: "ADMIN";
  MANAGER: "MANAGER";
  AFFILIATE: "AFFILIATE";
  PARENT: "PARENT";
  CUSTOMER: "CUSTOMER";
  FINANCE: "FINANCE";
};

export function canCreateSubscriptionForProfile(
  role: string | undefined | null,
  childProfileId: string | null | undefined
): boolean;

export function canUseCustomerLibrary(role: string | undefined | null): boolean;

export function canUseParentLibraryForChild(
  role: string | undefined | null,
  childProfileId: string | null | undefined
): boolean;

export function isAllAgeGroup(ageGroup: string | null | undefined): boolean;

export function isFlipbookReadableForChild(input: {
  isFree: boolean;
  childHasSubscription: boolean;
  flipbookAgeGroup?: string | null;
  childAgeGroup?: string | null;
}): boolean;

export function canViewUserProfile(input: {
  viewerRole: string | undefined | null;
  viewerId: string | undefined | null;
  targetUserId: string | undefined | null;
  targetUserRole: string | undefined | null;
  targetUserFields?: {
    managerId?: string | null;
    teamLeaderId?: string | null;
  };
}): {
  canView: boolean;
  canViewFull: boolean;
};
