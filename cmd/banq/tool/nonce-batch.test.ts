import { assertEquals, assertStrictEquals } from "@std/assert";
import { NonceBatch, type NonceData } from "./nonce-batch.ts";

function data(
  nonce: string,
  to = "0xaa",
  block_hash = "0xbb",
): NonceData {
  return {
    amount: 256,
    block_hash,
    hash: "0x00",
    interval: 1,
    nonce,
    now: "2025-01-01T00:00:00.000Z",
    to,
  };
}

Deno.test("NonceBatch(size 1) emits every nonce", () => {
  const batch = new NonceBatch(1);
  assertStrictEquals(batch.push(data("0x1"))?.length, 1);
  assertStrictEquals(batch.push(data("0x2"))?.length, 1);
});
Deno.test("NonceBatch(size 2) drains only when full", () => {
  const batch = new NonceBatch(2);
  assertStrictEquals(batch.push(data("0x1")), null);
  assertEquals(batch.push(data("0x2"))?.map((d) => d.nonce), ["0x1", "0x2"]);
});
Deno.test("NonceBatch(size 3) drains a full group", () => {
  const batch = new NonceBatch(3);
  assertStrictEquals(batch.push(data("0x1")), null);
  assertStrictEquals(batch.push(data("0x2")), null);
  assertEquals(
    batch.push(data("0x3"))?.map((d) => d.nonce),
    ["0x1", "0x2", "0x3"],
  );
});
Deno.test("NonceBatch drains early on block_hash change", () => {
  const batch = new NonceBatch(2);
  assertStrictEquals(batch.push(data("0x1")), null);
  // the mismatching nonce drains the pending group and becomes the new head
  assertEquals(
    batch.push(data("0x2", "0xaa", "0xcc"))?.map((d) => d.nonce),
    ["0x1"],
  );
  assertEquals(batch.pending, 1);
  assertEquals(
    batch.push(data("0x3", "0xaa", "0xcc"))?.map((d) => d.nonce),
    ["0x2", "0x3"],
  );
});
Deno.test("NonceBatch drains early on to change", () => {
  const batch = new NonceBatch(2);
  assertStrictEquals(batch.push(data("0x1")), null);
  assertEquals(
    batch.push(data("0x2", "0xcc"))?.map((d) => d.nonce),
    ["0x1"],
  );
  assertEquals(batch.pending, 1);
});
Deno.test("NonceBatch flush drains pending nonces", () => {
  const batch = new NonceBatch(4);
  assertStrictEquals(batch.push(data("0x1")), null);
  assertStrictEquals(batch.push(data("0x2")), null);
  assertEquals(batch.flush().map((d) => d.nonce), ["0x1", "0x2"]);
  assertEquals(batch.flush(), []);
});
