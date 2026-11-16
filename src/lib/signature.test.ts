import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyToken } from "./signature.ts";

test("token", () => {
  assert.equal(verifyToken("tok", "tok"), true);
  assert.equal(verifyToken("tok2", "tok"), false);
  assert.equal(verifyToken(null, "tok"), false);
  assert.equal(verifyToken("", ""), false);
  assert.equal(verifyToken("tok", undefined), false);
});
