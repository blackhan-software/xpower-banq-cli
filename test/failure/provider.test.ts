import { assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

const OPTS = {
  permissions: { env: true, net: true },
  sanitizeOps: false,
  sanitizeResources: false,
};

/**
 * @group failure — connection refused
 */
Deno.test("banq [supply, 1.0, APOW] connection refused", OPTS, () => {
  const args = {
    broadcast: true,
    pool: "P000",
    provider_url: "http://127.0.0.1:59999",
    private_key:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    rest: ["supply", 1.0, "APOW"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    Error,
  );
});

/**
 * @group failure — invalid provider URL
 */
Deno.test("banq [supply, 1.0, APOW] invalid provider-url", OPTS, () => {
  const args = {
    broadcast: true,
    pool: "P000",
    provider_url: "not-a-url",
    private_key:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    rest: ["supply", 1.0, "APOW"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid provider-url",
  );
});

/**
 * @group failure — multi-provider failover exhausts all
 */
Deno.test("banq [supply, 1.0, APOW] multi-provider all refuse", OPTS, () => {
  const args = {
    broadcast: true,
    pool: "P000",
    provider_url: "http://127.0.0.1:59999,http://127.0.0.1:60000",
    private_key:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    rest: ["supply", 1.0, "APOW"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    Error,
  );
});

/**
 * @group failure — invalid URL in multi-provider list fails fast
 */
Deno.test("banq [supply, 1.0, APOW] multi-provider invalid entry", OPTS, () => {
  const args = {
    broadcast: true,
    pool: "P000",
    provider_url: "http://127.0.0.1:59999,not-a-url",
    private_key:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    rest: ["supply", 1.0, "APOW"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid provider-url",
  );
});
