import test from "node:test";
import assert from "node:assert/strict";
import { BUILD_COST, deductTokens, type WalletState } from "../lib/tokenWallet";

test("each successful game build costs ten tokens", () => {
  assert.equal(BUILD_COST, 10);
  const wallet: WalletState = { balance: 50, usedCodes: [] };
  assert.deepEqual(deductTokens(wallet), { balance: 40, usedCodes: [] });
  assert.equal(wallet.balance, 50, "deduction must not mutate the original wallet");
});

test("wallet blocks a build when fewer than ten tokens remain", () => {
  assert.equal(deductTokens({ balance: 9, usedCodes: [] }), null);
});

test("unlimited wallet stays unlimited after a build", () => {
  assert.deepEqual(deductTokens({ balance: null, usedCodes: ["already-used"] }), { balance: null, usedCodes: ["already-used"] });
});

test("invalid deduction amounts are rejected", () => {
  assert.equal(deductTokens({ balance: 100, usedCodes: [] }, -10), null);
  assert.equal(deductTokens({ balance: 100, usedCodes: [] }, 1.5), null);
});
