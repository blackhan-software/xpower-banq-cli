import { assertEquals } from "@std/assert";
import {
  commas,
  format_delay,
  format_since,
  pad_left,
  pad_right,
  separator,
  vertical_headers,
} from "./acma-format.ts";

/**
 * @group positive tests — format_delay
 */
Deno.test("acma-format: format_delay 0", () => {
  assertEquals(format_delay(0), "0");
});
Deno.test("acma-format: format_delay 86400 = 1d", () => {
  assertEquals(format_delay(86400), "1d");
});
Deno.test("acma-format: format_delay 3600 = 1h", () => {
  assertEquals(format_delay(3600), "1h");
});
Deno.test("acma-format: format_delay 90 = 1m30s", () => {
  assertEquals(format_delay(90), "1m30s");
});
Deno.test("acma-format: format_delay 172800 = 2d", () => {
  assertEquals(format_delay(172800), "2d");
});
Deno.test("acma-format: format_delay 90061 = 1d1h1m1s", () => {
  assertEquals(format_delay(90061), "1d1h1m1s");
});
Deno.test("acma-format: format_delay 45 = 45s", () => {
  assertEquals(format_delay(45), "45s");
});

/**
 * @group positive tests — format_since
 */
Deno.test("acma-format: format_since 0 = now", () => {
  assertEquals(format_since(0), "now");
});
Deno.test("acma-format: format_since past = now", () => {
  // a timestamp in the past should return "now"
  assertEquals(format_since(1000000000), "now");
});
Deno.test("acma-format: format_since future = date", () => {
  // far future timestamp
  const since = Math.floor(Date.now() / 1000) + 86400 * 365;
  const result = format_since(since);
  // should be an ISO datetime string like "2027-03-08T12:34:56"
  assertEquals(result.length, 19);
  assertEquals(result[4], "-");
  assertEquals(result[10], "T");
  assertEquals(result[13], ":");
});

/**
 * @group positive tests — pad_right
 */
Deno.test("acma-format: pad_right pads short string", () => {
  assertEquals(pad_right("abc", 6), "abc   ");
});
Deno.test("acma-format: pad_right no pad for long string", () => {
  assertEquals(pad_right("abcdef", 3), "abcdef");
});

/**
 * @group positive tests — pad_left
 */
Deno.test("acma-format: pad_left pads short string", () => {
  assertEquals(pad_left("abc", 6), "   abc");
});

/**
 * @group positive tests — separator
 */
Deno.test("acma-format: separator builds dashes", () => {
  assertEquals(separator(5), "─────");
});

/**
 * @group positive tests — vertical_headers
 */
Deno.test("acma-format: vertical_headers single", () => {
  const rows = vertical_headers(["AB"], 2);
  assertEquals(rows.length, 2);
  assertEquals(rows[0].includes("A"), true);
  assertEquals(rows[1].includes("B"), true);
});
Deno.test("acma-format: vertical_headers multiple", () => {
  const rows = vertical_headers(["AB", "CD"], 2);
  assertEquals(rows.length, 2);
  assertEquals(rows[0].includes("A"), true);
  assertEquals(rows[0].includes("C"), true);
  assertEquals(rows[1].includes("B"), true);
  assertEquals(rows[1].includes("D"), true);
});
Deno.test("acma-format: vertical_headers uneven lengths", () => {
  const rows = vertical_headers(["ABC", "D"], 2);
  assertEquals(rows.length, 3); // max length is 3
});
Deno.test("acma-format: vertical_headers empty", () => {
  const rows = vertical_headers([], 2);
  assertEquals(rows.length, 0);
});

/**
 * @group positive tests — commas
 */
Deno.test("acma-format: commas formats numbers", () => {
  assertEquals(commas(0), "0");
  assertEquals(commas(1000), "1,000");
  assertEquals(commas(12345678), "12,345,678");
});
