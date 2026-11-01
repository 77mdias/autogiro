import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyHmacSha256, verifyBearer } from "./signature.ts";

const body = '{"event":"OrderPaid","data":{"id":1}}';
const sig = createHmac("sha256", "s3cr3t").update(body).digest("hex");

test("hmac válido, com e sem prefixo", () => {
  assert.equal(verifyHmacSha256(body, sig, "s3cr3t"), true);
  assert.equal(verifyHmacSha256(body, `sha256=${sig.toUpperCase()}`, "s3cr3t"), true);
});

test("hmac inválido", () => {
  assert.equal(verifyHmacSha256(body + " ", sig, "s3cr3t"), false);
  assert.equal(verifyHmacSha256(body, sig, "outro"), false);
  assert.equal(verifyHmacSha256(body, null, "s3cr3t"), false);
  assert.equal(verifyHmacSha256(body, sig, ""), false);
  assert.equal(verifyHmacSha256(body, "abc", "s3cr3t"), false);
});

test("bearer", () => {
  assert.equal(verifyBearer("Bearer tok", "tok"), true);
  assert.equal(verifyBearer("tok", "tok"), false);
  assert.equal(verifyBearer("Bearer tok", undefined), false);
  assert.equal(verifyBearer("Bearer tok2", "tok"), false);
  assert.equal(verifyBearer(null, "tok"), false);
});
