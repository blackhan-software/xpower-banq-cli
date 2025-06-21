import { assertEquals } from "@std/assert";
import "./json.ts";

/**
 * @group JSON BigInt serialization
 */
Deno.test("json: BigInt roundtrip", () => {
  const obj = { value: 123n };
  const json = JSON.stringify(obj);
  const parsed = JSON.parse(json);
  assertEquals(parsed.value, 123n);
});
Deno.test("json: negative BigInt", () => {
  const obj = { value: -42n };
  const json = JSON.stringify(obj);
  const parsed = JSON.parse(json);
  assertEquals(parsed.value, -42n);
});
Deno.test("json: zero BigInt", () => {
  const obj = { value: 0n };
  const json = JSON.stringify(obj);
  const parsed = JSON.parse(json);
  assertEquals(parsed.value, 0n);
});
Deno.test("json: non-bigint strings unchanged", () => {
  const json = JSON.stringify({ text: "hello" });
  const parsed = JSON.parse(json);
  assertEquals(parsed.text, "hello");
});
Deno.test("json: large BigInt (1e18)", () => {
  const big = 10n ** 18n;
  assertEquals(JSON.stringify(big), '"1000000000000000000n"');
  assertEquals(JSON.parse('"1000000000000000000n"'), big);
});
Deno.test("json: stringify format is quoted with n suffix", () => {
  assertEquals(JSON.stringify(123n), '"123n"');
});
Deno.test("json: numeric string without n preserved", () => {
  assertEquals(JSON.parse('"123"'), "123");
});
Deno.test("json: double-application guard", async () => {
  // importing again should not break anything
  const original = JSON.parse;
  await import("./json.ts");
  assertEquals(JSON.parse, original);
});
