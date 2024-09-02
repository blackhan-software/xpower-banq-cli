import { assertEquals } from "@std/assert";
import { parse } from "../../cli/calc/calc-args.ts";

Deno.test("parse []", () => {
  const args = parse([]);
  assertEquals(args.rest, []);
});
Deno.test("parse [--version]", () => {
  const args = parse(["--version"]);
  assertEquals(args.version, true);
  assertEquals(args.v, true);
  assertEquals(args.rest, []);
});
Deno.test("parse [-v]", () => {
  const args = parse(["-v"]);
  assertEquals(args.version, true);
  assertEquals(args.v, true);
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
