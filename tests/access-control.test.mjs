import test from "node:test";
import assert from "node:assert/strict";

import {
  canCreateSubscriptionForProfile,
  canUseCustomerLibrary,
  canUseParentLibraryForChild,
  isFlipbookReadableForChild,
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
