import test from "node:test";
import assert from "node:assert/strict";

import { selectCommissionIdsForPayout } from "../src/lib/payout.mjs";

test("selects approved commissions up to the payout amount oldest first", () => {
  const selected = selectCommissionIdsForPayout(75, [
    { id: "oldest", amount: 50 },
    { id: "too-large", amount: 40 },
    { id: "fits", amount: 25 },
  ]);

  assert.deepEqual(selected, ["oldest", "fits"]);
});

test("does not overpay beyond the payout amount", () => {
  const selected = selectCommissionIdsForPayout(30, [
    { id: "too-large", amount: 40 },
    { id: "fits", amount: 20 },
  ]);

  assert.deepEqual(selected, ["fits"]);
});
