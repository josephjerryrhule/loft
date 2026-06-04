import test from "node:test";
import assert from "node:assert/strict";

import {
  canCreateSubscriptionForProfile,
  canUseCustomerLibrary,
  canUseParentLibraryForChild,
  isAllAgeGroup,
  isFlipbookReadableForChild,
  canViewUserProfile,
} from "../src/lib/access-control.mjs";

test("parents can only create subscriptions for child profiles", () => {
  assert.equal(canCreateSubscriptionForProfile("PARENT", null), false);
  assert.equal(canCreateSubscriptionForProfile("PARENT", "child-1"), true);
});

test("customers can create self subscriptions but not child-profile subscriptions", () => {
  assert.equal(canCreateSubscriptionForProfile("CUSTOMER", null), true);
  assert.equal(canCreateSubscriptionForProfile("CUSTOMER", "child-1"), false);
});

test("customer library access is limited to customer role", () => {
  assert.equal(canUseCustomerLibrary("CUSTOMER"), true);
  assert.equal(canUseCustomerLibrary("PARENT"), false);
});

test("parent library access requires a child profile", () => {
  assert.equal(canUseParentLibraryForChild("PARENT", "child-1"), true);
  assert.equal(canUseParentLibraryForChild("PARENT", null), false);
  assert.equal(canUseParentLibraryForChild("CUSTOMER", "child-1"), false);
});

test("child flipbook readability respects free, subscription, and age group", () => {
  assert.equal(
    isFlipbookReadableForChild({
      isFree: false,
      childHasSubscription: false,
      flipbookAgeGroup: "LOFT_365",
      childAgeGroup: "LOFT_365",
    }),
    false
  );

  assert.equal(
    isFlipbookReadableForChild({
      isFree: true,
      childHasSubscription: false,
      flipbookAgeGroup: "BIG_READERS",
      childAgeGroup: "LOFT_365",
    }),
    false
  );

  assert.equal(
    isFlipbookReadableForChild({
      isFree: false,
      childHasSubscription: true,
      flipbookAgeGroup: "all age groups",
      childAgeGroup: "LOFT_365",
    }),
    true
  );
});

test("all-age variants are treated as readable for every child age group", () => {
  for (const allAgeValue of [null, "", "all", "ALL", "All Ages", "all ages", "ALL_AGES", "all age groups"]) {
    assert.equal(isAllAgeGroup(allAgeValue), true, `${allAgeValue} should be all-age`);
    assert.equal(
      isFlipbookReadableForChild({
        isFree: true,
        childHasSubscription: false,
        flipbookAgeGroup: allAgeValue,
        childAgeGroup: "LOFT_365",
      }),
      true,
      `${allAgeValue} should be readable for LOFT_365`
    );
  }
});

test("canViewUserProfile restricts ambassador profile visibility to own profile only", () => {
  // Test case 1: Ambassador (e.g. AFFILIATE) viewing their own profile (isSelf = true)
  const selfAffiliateResult = canViewUserProfile({
    viewerRole: "AFFILIATE",
    viewerId: "user-1",
    targetUserId: "user-1",
    targetUserRole: "AFFILIATE"
  });
  assert.deepEqual(selfAffiliateResult, { canView: true, canViewFull: true });

  // Test case 2: Ambassador (e.g. AFFILIATE) viewing another ambassador's profile
  const otherAffiliateResult = canViewUserProfile({
    viewerRole: "AFFILIATE",
    viewerId: "user-1",
    targetUserId: "user-2",
    targetUserRole: "AFFILIATE"
  });
  assert.deepEqual(otherAffiliateResult, { canView: false, canViewFull: false });

  // Test case 3: Ambassador (e.g. MANAGER) viewing another ambassador's profile
  const otherManagerResult = canViewUserProfile({
    viewerRole: "MANAGER",
    viewerId: "user-1",
    targetUserId: "user-2",
    targetUserRole: "AFFILIATE"
  });
  assert.deepEqual(otherManagerResult, { canView: false, canViewFull: false });

  // Test case 4: Ambassador (e.g. TEAM_LEADER) viewing an admin profile
  const ambassadorAdminResult = canViewUserProfile({
    viewerRole: "TEAM_LEADER",
    viewerId: "user-1",
    targetUserId: "admin-id",
    targetUserRole: "ADMIN"
  });
  assert.deepEqual(ambassadorAdminResult, { canView: false, canViewFull: false });

  // Test case 5: Admin viewing any profile fully
  const adminResult = canViewUserProfile({
    viewerRole: "ADMIN",
    viewerId: "admin-id",
    targetUserId: "user-1",
    targetUserRole: "AFFILIATE"
  });
  assert.deepEqual(adminResult, { canView: true, canViewFull: true });

  // Test case 6: Operations Manager viewing any profile fully
  const opsManagerResult = canViewUserProfile({
    viewerRole: "OPERATIONS_MANAGER",
    viewerId: "ops-id",
    targetUserId: "user-1",
    targetUserRole: "AFFILIATE"
  });
  assert.deepEqual(opsManagerResult, { canView: true, canViewFull: true });

  // Test case 7: Finance viewing another ambassador's profile (sanitized)
  const financeSanitizedResult = canViewUserProfile({
    viewerRole: "FINANCE",
    viewerId: "finance-id",
    targetUserId: "user-1",
    targetUserRole: "AFFILIATE"
  });
  // Since targetUserRole is AFFILIATE (ambassador), and viewer is FINANCE, canView = true (sanitized/payout checks), canViewFull = true because FINANCE is staff
  assert.deepEqual(financeSanitizedResult, { canView: true, canViewFull: true });
});
