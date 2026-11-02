import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyToken, verifyBearer } from "./signature.ts";

test("token", () => {
  assert.equal(verifyToken("tok", "tok"), true);
  assert.equal(verifyToken("tok2", "tok"), false);
  assert.equal(verifyToken(null, "tok"), false);
  assert.equal(verifyToken("", ""), false);
  assert.equal(verifyToken("tok", undefined), false);
});

test("bearer", () => {
  assert.equal(verifyBearer("Bearer tok", "tok"), true);
  assert.equal(verifyBearer("tok", "tok"), false);
  assert.equal(verifyBearer("Bearer tok", undefined), false);
  assert.equal(verifyBearer("Bearer tok2", "tok"), false);
  assert.equal(verifyBearer(null, "tok"), false);
});
