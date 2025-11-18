import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests: watch with range (--watch=N)
 */
Deno.test(
  "banq -oT000 [retwap, APOW, XPOW, --watch=100]",
  OPTS,
  async () => {
    const args = {
      oracle: "T000",
      watch: "100",
      rest: ["retwap", "APOW", "XPOW"],
    };
    const call = ["retwap", ["APOW", "XPOW", "[100]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);
Deno.test(
  "banq -oT000 [retwap, XPOW, APOW, --watch=100]",
  OPTS,
  async () => {
    const args = {
      oracle: "T000",
      watch: "100",
      rest: ["retwap", "XPOW", "APOW"],
    };
    const call = ["retwap", ["XPOW", "APOW", "[100]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);
/**
 * @group positive tests: watch with block range (--watch=LHS:RHS)
 */
Deno.test(
  "banq -oT000 [retwap, APOW, XPOW, --watch=100@1]",
  OPTS,
  async () => {
    const args = {
      oracle: "T000",
      watch: "100@1",
      rest: ["retwap", "APOW", "XPOW"],
    };
    const call = ["retwap", ["APOW", "XPOW", "[100,1]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);
Deno.test(
  "banq -oT000 [retwap, XPOW, APOW, --watch=100@1]",
  OPTS,
  async () => {
    const args = {
      oracle: "T000",
      watch: "100@1",
      rest: ["retwap", "XPOW", "APOW"],
    };
    const call = ["retwap", ["XPOW", "APOW", "[100,1]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);
/**
 * @group positive tests: watch real-time (--watch)
 */
Deno.test("banq -oT000 [retwap, APOW, XPOW, --watch]", OPTS, async () => {
  const args = {
    oracle: "T000",
    watch: "",
    rest: ["retwap", "APOW", "XPOW"],
  };
  const call = ["retwap", ["APOW", "XPOW", true], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq -oT000 [retwap, XPOW, APOW, --watch]", OPTS, async () => {
  const args = {
    oracle: "T000",
    watch: "",
    rest: ["retwap", "XPOW", "APOW"],
  };
  const call = ["retwap", ["XPOW", "APOW", true], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests: watch with invalid inputs
 */
Deno.test("banq -oT000 [retwap, --watch=100]", OPTS, () => {
  const args = {
    oracle: "T000",
    watch: "100",
    rest: ["retwap"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -oT000 [retwap, XYZT, APOW, --watch=100]", OPTS, () => {
  const args = {
    oracle: "T000",
    watch: "100",
    rest: ["retwap", "XYZT", "APOW"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
Deno.test("banq -oT000 [retwap, APOW, --watch=100]", OPTS, () => {
  const args = {
    oracle: "T000",
    watch: "100",
    rest: ["retwap", "APOW"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -oT000 [retwap, APOW, XYZT, --watch=100]", OPTS, () => {
  const args = {
    oracle: "T000",
    watch: "100",
    rest: ["retwap", "APOW", "XYZT"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
Deno.test("banq -oT000 [retwap, --watch]", OPTS, () => {
  const args = {
    oracle: "T000",
    watch: "",
    rest: ["retwap"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -oT000 [retwap, XYZT, APOW, --watch]", OPTS, () => {
  const args = {
    oracle: "T000",
    watch: "",
    rest: ["retwap", "XYZT", "APOW"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
Deno.test("banq -oT000 [retwap, APOW, --watch]", OPTS, () => {
  const args = {
    oracle: "T000",
    watch: "",
    rest: ["retwap", "APOW"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -oT000 [retwap, APOW, XYZT, --watch]", OPTS, () => {
  const args = {
    oracle: "T000",
    watch: "",
    rest: ["retwap", "APOW", "XYZT"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
