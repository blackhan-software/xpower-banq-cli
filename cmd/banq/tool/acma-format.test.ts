import { assertEquals } from "@std/assert";
import { cache_clear } from "../../../env/cache-by.ts";
import { set_registry_reverse } from "../../../env/registry-reverse.ts";
import {
  commas,
  format_delay,
  format_since,
  hex_prefix,
  pad_left,
  pad_right,
  pending_mark,
  separator,
  short_label,
  sorted_by_label,
  vertical_headers,
  vertical_headers_pairs,
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
 * @group positive tests — hex_prefix
 */
Deno.test("acma-format: hex_prefix uppercase no 0x", () => {
  assertEquals(hex_prefix(0x9f3a800000000000000000000000000000000000n), "9F3A");
});
Deno.test("acma-format: hex_prefix pads short addresses", () => {
  assertEquals(hex_prefix(0x1000n), "0000");
  assertEquals(hex_prefix(0x1234000000000000000000000000000000000000n), "1234");
});

/**
 * @group positive tests — vertical_headers_pairs
 */
Deno.test("acma-format: vertical_headers_pairs adjacent", () => {
  const rows = vertical_headers_pairs([["NAME", "9F3A"]], 2);
  assertEquals(rows.length, 4);
  // labels render adjacent with no inner spacing
  assertEquals(rows[0], "N9");
  assertEquals(rows[1], "AF");
  assertEquals(rows[2], "M3");
  assertEquals(rows[3], "EA");
});
Deno.test("acma-format: vertical_headers_pairs pads to cell width", () => {
  const rows = vertical_headers_pairs([["NAME", "9F3A"]], 3);
  assertEquals(rows[0], "N9 ");
  assertEquals(rows[3], "EA ");
});
Deno.test("acma-format: vertical_headers_pairs single left-aligned", () => {
  const rows = vertical_headers_pairs([["ABCD"]], 3);
  assertEquals(rows.length, 4);
  assertEquals(rows[0], "A  ");
  assertEquals(rows[3], "D  ");
});
Deno.test("acma-format: vertical_headers_pairs empty", () => {
  const rows = vertical_headers_pairs([], 2);
  assertEquals(rows.length, 0);
});

/**
 * @group positive tests — sorted_by_label
 */
const ENV_OPTS = { permissions: { env: true } };
Deno.test(
  "acma-format: sorted_by_label orders hex labels A→Z",
  ENV_OPTS,
  () => {
    const sorted = sorted_by_label([
      0xCCCC0000000000000000000000000000000000n,
      0xAAAA0000000000000000000000000000000000n,
      0xBBBB0000000000000000000000000000000000n,
    ]);
    assertEquals(
      sorted,
      [
        0xAAAA0000000000000000000000000000000000n,
        0xBBBB0000000000000000000000000000000000n,
        0xCCCC0000000000000000000000000000000000n,
      ],
    );
  },
);

Deno.test(
  "acma-format: sorted_by_label orders registry names A→Z",
  ENV_OPTS,
  () => {
    const boss = 0x1111111111111111111111111111111111111111n;
    const caps = 0x2222222222222222222222222222222222222222n;
    const liqu = 0x3333333333333333333333333333333333333333n;
    set_registry_reverse(
      new Map([
        [boss, "BOSS"],
        [caps, "CAPS"],
        [liqu, "LIQU"],
      ]),
    );
    cache_clear();
    try {
      const sorted = sorted_by_label([liqu, boss, caps]);
      assertEquals(sorted, [boss, caps, liqu]);
      assertEquals(sorted.map((a) => short_label(a)), ["BOSS", "CAPS", "LIQU"]);
    } finally {
      set_registry_reverse(new Map());
      cache_clear();
    }
  },
);

Deno.test(
  "acma-format: sorted_by_label tie-breaks equal labels by address",
  ENV_OPTS,
  () => {
    const low = 0x1234n << 128n;
    const high = low + 1n;
    assertEquals(short_label(low), short_label(high));
    const sorted = sorted_by_label([high, low]);
    assertEquals(sorted, [low, high]);
  },
);

Deno.test(
  "acma-format: short_label uses names fallback for unknown address",
  ENV_OPTS,
  () => {
    const pols = 0x1111000000000000000000000000000000000000n;
    const names = new Map([[pols, "POLS"]]);
    assertEquals(short_label(pols, names), "POLS");
    assertEquals(short_label(pols), "1111");
  },
);

Deno.test(
  "acma-format: short_label registry wins over names fallback",
  ENV_OPTS,
  () => {
    const pool = 0x2222000000000000000000000000000000000000n;
    set_registry_reverse(new Map([[pool, "P007"]]));
    cache_clear();
    try {
      const names = new Map([[pool, "POOL"]]);
      assertEquals(short_label(pool, names), "P007");
    } finally {
      set_registry_reverse(new Map());
      cache_clear();
    }
  },
);

Deno.test(
  "acma-format: sorted_by_label orders by names fallback",
  ENV_OPTS,
  () => {
    const pols = 0x3333000000000000000000000000000000000000n;
    const vault = 0x1111000000000000000000000000000000000000n;
    const names = new Map([
      [pols, "POLS"],
      [vault, "VAULT"],
    ]);
    const sorted = sorted_by_label([pols, vault], names);
    assertEquals(sorted, [pols, vault]);
    assertEquals(sorted.map((a) => short_label(a, names)), ["POLS", "VAUL"]);
  },
);

/**
 * @group positive tests — commas
 */
Deno.test("acma-format: commas formats numbers", () => {
  assertEquals(commas(0), "0");
  assertEquals(commas(1000), "1,000");
  assertEquals(commas(12345678), "12,345,678");
});

/**
 * @group positive tests — pending_mark
 */
Deno.test("acma-format: pending_mark undefined -> ·", () => {
  assertEquals(pending_mark(undefined, 86400), "\u00B7");
});

Deno.test("acma-format: pending_mark active since=0 -> +", () => {
  assertEquals(pending_mark({ since: 0 }, 86400), "+");
});

Deno.test("acma-format: pending_mark active past -> +", () => {
  assertEquals(pending_mark({ since: 1000000000 }, 86400), "+");
});

Deno.test("acma-format: pending_mark just granted -> ○", () => {
  const now = Math.floor(Date.now() / 1000);
  const since = now + 86400; // 24h from now
  const delay = 86400; // 24h grant delay
  // grantTime ≈ now, hoursLeft ≈ 24 → ○ (>=18h)
  assertEquals(pending_mark({ since }, delay), "\u25CB");
});

Deno.test("acma-format: pending_mark mid-progress -> ◑", () => {
  const now = Math.floor(Date.now() / 1000);
  const since = now + 43200; // 12h until active
  const delay = 86400; // 24h grant delay
  // hoursLeft ≈ 12 → ◑ (6h-12h)
  assertEquals(pending_mark({ since }, delay), "\u25D1");
});

Deno.test("acma-format: pending_mark almost active -> ◉", () => {
  const now = Math.floor(Date.now() / 1000);
  const since = now + 3600; // 1h until active
  const delay = 86400; // 24h grant delay
  // hoursLeft ≈ 1 → ◉ (<1h, about to activate)
  assertEquals(pending_mark({ since }, delay), "\u25C9");
});

Deno.test("acma-format: pending_mark grantDelay=0 future since -> +", () => {
  const now = Math.floor(Date.now() / 1000);
  assertEquals(pending_mark({ since: now + 3600 }, 0), "+");
});

Deno.test("acma-format: pending_mark short delay -> ◉", () => {
  const now = Math.floor(Date.now() / 1000);
  const since = now + 60; // 60s until active
  const delay = 120; // 2m grant delay
  // hoursLeft ≈ 0.017 → ◉ (<1h, falls through)
  assertEquals(pending_mark({ since }, delay), "\u25C9");
});
