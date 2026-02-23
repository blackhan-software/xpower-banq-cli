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
  "banq -p P000 -M supply [reindex, APOW, --watch=100]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      watch: "100",
      rest: ["reindex", "APOW"],
    };
    const call = ["reindex", ["sAPOW", "[100]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);
Deno.test(
  "banq -p P000 -M supply [reindex, XPOW, --watch=100]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      watch: "100",
      rest: ["reindex", "XPOW"],
    };
    const call = ["reindex", ["sXPOW", "[100]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);
Deno.test(
  "banq -p P000 -M borrow [reindex, APOW, --watch=100]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "borrow",
      watch: "100",
      rest: ["reindex", "APOW"],
    };
    const call = ["reindex", ["bAPOW", "[100]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);
Deno.test(
  "banq -p P000 -M borrow [reindex, XPOW, --watch=100]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "borrow",
      watch: "100",
      rest: ["reindex", "XPOW"],
    };
    const call = ["reindex", ["bXPOW", "[100]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);
/**
 * @group positive tests: watch with block range (--watch=LHS:RHS)
 */
Deno.test(
  "banq -p P000 -M supply [reindex, APOW, --watch=100@1]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      watch: "100@1",
      rest: ["reindex", "APOW"],
    };
    const call = ["reindex", ["sAPOW", "[100,1]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);
Deno.test(
  "banq -p P000 -M supply [reindex, XPOW, --watch=100@1]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      watch: "100@1",
      rest: ["reindex", "XPOW"],
    };
    const call = ["reindex", ["sXPOW", "[100,1]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);
Deno.test(
  "banq -p P000 -M borrow [reindex, APOW, --watch=100@1]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "borrow",
      watch: "100@1",
      rest: ["reindex", "APOW"],
    };
    const call = ["reindex", ["bAPOW", "[100,1]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);
Deno.test(
  "banq -p P000 -M borrow [reindex, XPOW, --watch=100@1]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "borrow",
      watch: "100@1",
      rest: ["reindex", "XPOW"],
    };
    const call = ["reindex", ["bXPOW", "[100,1]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);
/**
 * @group positive tests: watch real-time (--watch)
 */
Deno.test("banq -p P000 -M supply [reindex, APOW, --watch]", OPTS, async () => {
  const args = {
    pool: "P000",
    mode: "supply",
    watch: "",
    rest: ["reindex", "APOW"],
  };
  const call = ["reindex", ["sAPOW", true], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq -p P000 -M supply [reindex, XPOW, --watch]", OPTS, async () => {
  const args = {
    pool: "P000",
    mode: "supply",
    watch: "",
    rest: ["reindex", "XPOW"],
  };
  const call = ["reindex", ["sXPOW", true], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq -p P000 -M borrow [reindex, APOW, --watch]", OPTS, async () => {
  const args = {
    pool: "P000",
    mode: "borrow",
    watch: "",
    rest: ["reindex", "APOW"],
  };
  const call = ["reindex", ["bAPOW", true], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq -p P000 -M borrow [reindex, XPOW, --watch]", OPTS, async () => {
  const args = {
    pool: "P000",
    mode: "borrow",
    watch: "",
    rest: ["reindex", "XPOW"],
  };
  const call = ["reindex", ["bXPOW", true], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests: watch with invalid inputs
 */
Deno.test("banq -p P000 -M supply [reindex, --watch=100]", OPTS, () => {
  const args = {
    pool: "P000",
    mode: "supply",
    watch: "100",
    rest: ["reindex"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -p P000 -M borrow [reindex, XYZT, --watch=100]", OPTS, () => {
  const args = {
    pool: "P000",
    mode: "borrow",
    watch: "100",
    rest: ["reindex", "XYZT"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
Deno.test("banq -p P999 -M supply [reindex, APOW, --watch=100]", OPTS, () => {
  const args = {
    pool: "P999",
    mode: "supply",
    watch: "100",
    rest: ["reindex", "APOW"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid pool: P999",
  );
});
Deno.test("banq -p P000 [reindex, APOW, --watch=100]", OPTS, () => {
  const args = {
    pool: "P000",
    watch: "100",
    rest: ["reindex", "APOW"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid mode: undefined",
  );
});
Deno.test("banq -p P000 -M supply [reindex, --watch]", OPTS, () => {
  const args = {
    pool: "P000",
    mode: "supply",
    watch: "",
    rest: ["reindex"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -p P000 -M borrow [reindex, XYZT, --watch]", OPTS, () => {
  const args = {
    pool: "P000",
    mode: "borrow",
    watch: "",
    rest: ["reindex", "XYZT"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
Deno.test("banq -p P999 -M supply [reindex, APOW, --watch]", OPTS, () => {
  const args = {
    pool: "P999",
    mode: "supply",
    watch: "",
    rest: ["reindex", "APOW"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid pool: P999",
  );
});
Deno.test("banq -p P000 [reindex, APOW, --watch]", OPTS, () => {
  const args = {
    pool: "P000",
    watch: "",
    rest: ["reindex", "APOW"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid mode: undefined",
  );
});
