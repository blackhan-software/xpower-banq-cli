import { assertEquals, assertThrows } from "@std/assert";
import { opt_nft_ids } from "./opt-nft-id.ts";
import { ArgumentError } from "./types.ts";

Deno.test("opt_nft_ids [202100]", () => {
  assertEquals(opt_nft_ids({ nft_id: 202100 }), [202100]);
});
Deno.test("opt_nft_ids ['202100,202103']", () => {
  assertEquals(opt_nft_ids({ nft_id: "202100,202103" }), [202100, 202103]);
});
Deno.test("opt_nft_ids [202101] throws (mod 3)", () => {
  assertThrows(() => opt_nft_ids({ nft_id: 202101 }), ArgumentError);
});
Deno.test("opt_nft_ids [100] throws (below base)", () => {
  assertThrows(() => opt_nft_ids({ nft_id: 100 }), ArgumentError);
});
Deno.test("opt_nft_ids [] throws", () => {
  assertThrows(() => opt_nft_ids(), ArgumentError);
});
