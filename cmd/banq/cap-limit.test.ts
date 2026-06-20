import { assertEquals, assertRejects } from "@std/assert";
import { cli_next } from "../../cli/banq/banq.ts";
import type { BanqArgs } from "../../cli/banq/banq.ts";

Deno.test(
  "cap-limit --mode=supply (absolute)",
  { permissions: { env: true } },
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      rest: ["cap-limit", "APOW", "1000"],
    };
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, ["cap-limit", ["APOW", "supply", "cap", 1000n], [
      false,
    ]]);
  },
);

Deno.test(
  "cap-limit --mode=borrow (absolute)",
  { permissions: { env: true } },
  async () => {
    const args = {
      pool: "P000",
      mode: "borrow",
      rest: ["cap-limit", "APOW", "0"],
    };
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, ["cap-limit", ["APOW", "borrow", "cap", 0n], [
      false,
    ]]);
  },
);

Deno.test(
  "cap-limit --mode=supply --inc",
  { permissions: { env: true } },
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      inc: true,
      rest: ["cap-limit", "APOW", "500"],
    };
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, ["cap-limit", ["APOW", "supply", "inc", 500n], [
      false,
    ]]);
  },
);

Deno.test(
  "cap-limit --mode=borrow --dec",
  { permissions: { env: true } },
  async () => {
    const args = {
      pool: "P000",
      mode: "borrow",
      dec: true,
      rest: ["cap-limit", "APOW", "200"],
    };
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, ["cap-limit", ["APOW", "borrow", "dec", 200n], [
      false,
    ]]);
  },
);

Deno.test(
  "cap-limit --mode=borrow --decrease",
  { permissions: { env: true } },
  async () => {
    const args = {
      pool: "P000",
      mode: "borrow",
      decrease: true,
      rest: ["cap-limit", "APOW", "0"],
    };
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, ["cap-limit", ["APOW", "borrow", "dec", 0n], [
      false,
    ]]);
  },
);

Deno.test(
  "cap-limit --mode=supply --increase",
  { permissions: { env: true } },
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      increase: true,
      rest: ["cap-limit", "APOW", "300"],
    };
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, ["cap-limit", ["APOW", "supply", "inc", 300n], [
      false,
    ]]);
  },
);

Deno.test(
  "cap-limit --mode=supply --dec",
  { permissions: { env: true } },
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      dec: true,
      rest: ["cap-limit", "APOW", "75"],
    };
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, ["cap-limit", ["APOW", "supply", "dec", 75n], [
      false,
    ]]);
  },
);

Deno.test(
  "cap-limit --mode=borrow --inc",
  { permissions: { env: true } },
  async () => {
    const args = {
      pool: "P000",
      mode: "borrow",
      inc: true,
      rest: ["cap-limit", "APOW", "50"],
    };
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, ["cap-limit", ["APOW", "borrow", "inc", 50n], [
      false,
    ]]);
  },
);

Deno.test(
  "cap-limit --mode=borrow --inc --dec (error)",
  { permissions: { env: true } },
  async () => {
    const args = {
      pool: "P000",
      mode: "borrow",
      inc: true,
      dec: true,
      rest: ["cap-limit", "APOW", "10"],
    };
    await assertRejects(
      () => cli_next(args as BanqArgs),
      Error,
      "exclusive --inc and --dec",
    );
  },
);

Deno.test(
  "cap (shortcut, absolute)",
  { permissions: { env: true } },
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      rest: ["cap", "APOW", "1000"],
    };
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, ["cap-limit", ["APOW", "supply", "cap", 1000n], [
      false,
    ]]);
  },
);

Deno.test(
  "cl (shortcut, absolute)",
  { permissions: { env: true } },
  async () => {
    const args = {
      pool: "P000",
      mode: "borrow",
      rest: ["cl", "APOW", "0"],
    };
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, ["cap-limit", ["APOW", "borrow", "cap", 0n], [
      false,
    ]]);
  },
);
