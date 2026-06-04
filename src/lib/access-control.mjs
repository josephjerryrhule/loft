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

export function canViewUserProfile({
  viewerRole,
  viewerId,
  targetUserId,
  targetUserRole,
  targetUserFields = {},
}) {
  const isSelf = viewerId === targetUserId;
  const isAdmin = viewerRole === ROLE.ADMIN;
  const isOpsManager = viewerRole === ROLE.OPERATIONS_MANAGER;
  const isFinance = viewerRole === ROLE.FINANCE;
  const isManagerOfUser = targetUserFields?.managerId === viewerId;
  const isTeamLeaderOfUser = targetUserFields?.teamLeaderId === viewerId;

  const isViewerAmbassador = [ROLE.MANAGER, ROLE.TEAM_LEADER, ROLE.AFFILIATE].includes(viewerRole);

  if (isViewerAmbassador) {
    // IF logged-in user role = Ambassador → allow profile access only where: profile.user_id = logged_in_user_id
    return {
      canView: isSelf,
      canViewFull: isSelf,
    };
  }

  // For Admin, Operations Manager, Finance, and other roles (like PARENT, CUSTOMER)
  const canViewFull = isAdmin || isOpsManager || isFinance || isSelf || isManagerOfUser || isTeamLeaderOfUser;

  // Check if target is an ambassador and viewer is allowed to view sanitized
  const isViewerAllowedSanitized = [ROLE.ADMIN, ROLE.OPERATIONS_MANAGER, ROLE.FINANCE].includes(viewerRole);
  const isTargetAmbassador = [ROLE.ADMIN, ROLE.OPERATIONS_MANAGER, ROLE.MANAGER, ROLE.TEAM_LEADER, ROLE.AFFILIATE].includes(targetUserRole);
  const canViewSanitized = isViewerAllowedSanitized && isTargetAmbassador;

  return {
    canView: canViewFull || canViewSanitized,
    canViewFull: canViewFull,
  };
}
