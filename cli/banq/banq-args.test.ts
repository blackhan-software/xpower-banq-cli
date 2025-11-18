import { assertEquals } from "@std/assert";
import { parse } from "../../cli/banq/banq-args.ts";

Deno.test("parse []", () => {
  const args = parse([]);
  assertEquals(args.rest, []);
});
Deno.test("parse [--cli-version]", () => {
  const args = parse(["--cli-version"]);
  assertEquals(args.cli_version, true);
  assertEquals(args.v, true);
  assertEquals(args.rest, []);
});
Deno.test("parse [-v]", () => {
  const args = parse(["-v"]);
  assertEquals(args.cli_version, true);
  assertEquals(args.v, true);
  assertEquals(args.rest, []);
});
Deno.test("parse [--contract-run=v10a]", () => {
  const args = parse(["--contract-run=v10a"]);
  assertEquals(args.contract_run, "v10a");
  assertEquals(args.V, "v10a");
  assertEquals(args.rest, []);
});
Deno.test("parse [-V v10b]", () => {
  const args = parse(["-V", "v10b"]);
  assertEquals(args.contract_run, "v10b");
  assertEquals(args.V, "v10b");
  assertEquals(args.rest, []);
});
Deno.test("parse [--help]", () => {
  const args = parse(["--help"]);
  assertEquals(args.help, true);
  assertEquals(args.h, true);
  assertEquals(args.rest, []);
});
Deno.test("parse [-h]", () => {
  const args = parse(["-h"]);
  assertEquals(args.help, true);
  assertEquals(args.h, true);
  assertEquals(args.rest, []);
});
Deno.test("parse [--pool={none,P000}]", () => {
  const defs = parse([]);
  assertEquals(defs.pool, undefined);
  assertEquals(defs.rest, []);
  const args = parse(["--pool=P000"]);
  assertEquals(args.pool, "P000");
  assertEquals(args.rest, []);
});
Deno.test("parse [--oracle={none,T000}]", () => {
  const defs = parse([]);
  assertEquals(defs.oracle, undefined);
  assertEquals(defs.rest, []);
  const args = parse(["--oracle=T000"]);
  assertEquals(args.oracle, "T000");
  assertEquals(args.rest, []);
});
Deno.test("parse [--provider-url={none,file:///socket}]", () => {
  const defs = parse([]);
  assertEquals(defs.provider_url, undefined);
  assertEquals(defs.rest, []);
  const args = parse(["--provider-url=file:///socket"]);
  assertEquals(args.provider_url, "file:///socket");
  assertEquals(args.rest, []);
});
Deno.test("parse [--hd-path={none,44'/60'/0'/0/1}]", () => {
  const defs = parse([]);
  assertEquals(defs.hd_path, undefined);
  assertEquals(defs.rest, []);
  const args = parse(["--hd-path=44'/60'/0'/0/1"]);
  assertEquals(args.hd_path, "44'/60'/0'/0/1");
  assertEquals(args.rest, []);
});
