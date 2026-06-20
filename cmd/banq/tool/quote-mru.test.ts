import { assertEquals } from "@std/assert";
import { ethers } from "ethers";
import { oracle_abi } from "../abi/abis.ts";
import { quote_mru } from "./quote-mru.ts";

Deno.test("quote_mru: v11a packed twap_lin", () => {
  const packed = BigInt(
    "0x00000000000000000000464958aa57f4000148f5d4bed0d200006ac49ca01212",
  );
  const mru = quote_mru(packed, "v11a");
  assertEquals(mru.quote_mid, 77280834115572n);
  assertEquals(mru.quote_rel, 361695650173138n);
  assertEquals(mru.quote_utc, 1791270048n);
});

Deno.test("quote_mru: v10c packed twap_lin", () => {
  const packed = BigInt(
    "0x00000000000000000000464958aa57f4000148f5d4bed0d200006ac49ca01212",
  );
  assertEquals(quote_mru(packed, "v10c"), quote_mru(packed, "v11a"));
});

Deno.test("quote_mru: v11b tick tuple", () => {
  const mru = quote_mru(
    { price: 86607758536n, spread: 12345n, stamp: 1791270048n },
    "v11b",
  );
  assertEquals(mru.quote_mid, 86607758536n);
  assertEquals(mru.quote_rel, 12345n);
  assertEquals(mru.quote_utc, 1791270048n);
});

Deno.test("quote_mru: v11b zero tick", () => {
  const mru = quote_mru({ price: 0n, spread: 0n, stamp: 0n }, "v11b");
  assertEquals(mru, { quote_mid: 0n, quote_rel: 0n, quote_utc: 0n });
});

Deno.test("quote_mru: v11b ABI round-trip", () => {
  const iface = new ethers.Interface(oracle_abi("v11b"));
  const frag = iface.getEvent("Refresh")!;
  const source = "0x00000000000000000000000000000000000000aa";
  const target = "0x00000000000000000000000000000000000000bb";
  const tick = {
    stamp: 1791270048n,
    price: 86607758536n,
    spread: 12345n,
    s2t_decimals: 0x1206n,
  };
  const { data } = iface.encodeEventLog(frag, [source, target, tick]);
  const decoded = iface.decodeEventLog(frag, data);
  assertEquals(quote_mru(decoded[2], "v11b"), {
    quote_mid: 86607758536n,
    quote_rel: 12345n,
    quote_utc: 1791270048n,
  });
});
