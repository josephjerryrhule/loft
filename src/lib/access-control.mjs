export const ROLE = {
  ADMIN: "ADMIN",
  OPERATIONS_MANAGER: "OPERATIONS_MANAGER",
  MANAGER: "MANAGER",
  TEAM_LEADER: "TEAM_LEADER",
  AFFILIATE: "AFFILIATE",
  PARENT: "PARENT",
  CUSTOMER: "CUSTOMER",
  FINANCE: "FINANCE",
};

export function canCreateSubscriptionForProfile(role, childProfileId) {
  if (role === ROLE.PARENT) return Boolean(childProfileId);
  if (role === ROLE.CUSTOMER) return !childProfileId;
  if (role === ROLE.ADMIN) return true;
  return false;
}

export function canUseCustomerLibrary(role) {
  return role === ROLE.CUSTOMER;
}

export function canUseParentLibraryForChild(role, childProfileId) {
  return role === ROLE.PARENT && Boolean(childProfileId);
}

export function isAllAgeGroup(ageGroup) {
  if (!ageGroup) return true;
  const normalized = String(ageGroup).trim().toLowerCase().replace(/[_-]+/g, " ");
  return (
    normalized === "" ||
    normalized === "all" ||
    normalized === "all age groups" ||
    normalized === "all ages"
  );
}

export function isFlipbookReadableForChild({
  isFree,
  childHasSubscription,
  flipbookAgeGroup,
  childAgeGroup,
}) {
  const hasEntitlement = Boolean(isFree) || Boolean(childHasSubscription);
  const ageMatches = isAllAgeGroup(flipbookAgeGroup) || flipbookAgeGroup === childAgeGroup;
  return hasEntitlement && ageMatches;
}
