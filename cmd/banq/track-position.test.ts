import { assertEquals, assertRejects } from "@std/assert";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

const OPTS = {
  permissions: { env: true },
};

/**
 * @group positive tests: oneshot (no watch)
 */
Deno.test("banq -p P000 -M supply [track-position, APOW]", OPTS, async () => {
  const args = {
    pool: "P000",
    mode: "supply",
    rest: ["track-position", "APOW"],
  };
  const call = [
    "track-position",
    ["sAPOW", false],
    [
      false,
    ],
  ];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});

Deno.test("banq -p P000 -M supply [track-position, XPOW]", OPTS, async () => {
  const args = {
    pool: "P000",
    mode: "supply",
    rest: ["track-position", "XPOW"],
  };
  const call = [
    "track-position",
    ["sXPOW", false],
    [
      false,
    ],
  ];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});

Deno.test("banq -p P000 -M borrow [track-position, APOW]", OPTS, async () => {
  const args = {
    pool: "P000",
    mode: "borrow",
    rest: ["track-position", "APOW"],
  };
  const call = [
    "track-position",
    ["bAPOW", false],
    [
      false,
    ],
  ];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});

Deno.test("banq -p P000 -M borrow [track-position, XPOW]", OPTS, async () => {
  const args = {
    pool: "P000",
    mode: "borrow",
    rest: ["track-position", "XPOW"],
  };
  const call = [
    "track-position",
    ["bXPOW", false],
    [
      false,
    ],
  ];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});

Deno.test("banq -p P001 -M supply [track-position, AVAX]", OPTS, async () => {
  const args = {
    pool: "P001",
    mode: "supply",
    rest: ["track-position", "AVAX"],
  };
  const call = [
    "track-position",
    ["sAVAX", false],
    [
      false,
    ],
  ];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});

/**
 * @group positive tests: watch with range (--watch=N)
 */
Deno.test(
  "banq -p P000 -M supply [track-position, APOW, --watch=100]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      watch: "100",
      rest: ["track-position", "APOW"],
    };
    const call = ["track-position", ["sAPOW", "[100]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);

Deno.test(
  "banq -p P000 -M supply [track-position, XPOW, --watch=100]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      watch: "100",
      rest: ["track-position", "XPOW"],
    };
    const call = ["track-position", ["sXPOW", "[100]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);

Deno.test(
  "banq -p P000 -M borrow [track-position, APOW, --watch=100]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "borrow",
      watch: "100",
      rest: ["track-position", "APOW"],
    };
    const call = ["track-position", ["bAPOW", "[100]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);

Deno.test(
  "banq -p P000 -M borrow [track-position, XPOW, --watch=100]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "borrow",
      watch: "100",
      rest: ["track-position", "XPOW"],
    };
    const call = ["track-position", ["bXPOW", "[100]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);

/**
 * @group positive tests: watch with block range (--watch=LHS@IDX)
 */
Deno.test(
  "banq -p P000 -M supply [track-position, APOW, --watch=100@1]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      watch: "100@1",
      rest: ["track-position", "APOW"],
    };
    const call = ["track-position", ["sAPOW", "[100,1]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);

Deno.test(
  "banq -p P000 -M supply [track-position, XPOW, --watch=100@0]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      watch: "100@0",
      rest: ["track-position", "XPOW"],
    };
    const call = ["track-position", ["sXPOW", "[100,0]"], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);

/**
 * @group positive tests: watch all (--watch=DLT@all)
 */
Deno.test(
  "banq -p P000 -M supply -w 100@all [track-position, APOW]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      watch: "100@all",
      rest: ["track-position", "APOW"],
    };
    const call = [
      "track-position",
      ["sAPOW", JSON.stringify([100, Infinity])],
      [
        false,
      ],
    ];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);

Deno.test(
  "banq -p P000 -M supply -w 100@all [track-position, XPOW]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      watch: "100@all",
      rest: ["track-position", "XPOW"],
    };
    const call = [
      "track-position",
      ["sXPOW", JSON.stringify([100, Infinity])],
      [
        false,
      ],
    ];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);

Deno.test(
  "banq -p P000 -M borrow -w 200@all [track-position, APOW]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "borrow",
      watch: "200@all",
      rest: ["track-position", "APOW"],
    };
    const call = [
      "track-position",
      ["bAPOW", JSON.stringify([200, Infinity])],
      [
        false,
      ],
    ];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);

/**
 * @group positive tests: watch live (--watch, no argument)
 */
Deno.test(
  "banq -p P000 -M supply -w [track-position, APOW]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "supply",
      watch: "",
      rest: ["track-position", "APOW"],
    };
    const call = ["track-position", ["sAPOW", true], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);

Deno.test(
  "banq -p P000 -M borrow -w [track-position, XPOW]",
  OPTS,
  async () => {
    const args = {
      pool: "P000",
      mode: "borrow",
      watch: "",
      rest: ["track-position", "XPOW"],
    };
    const call = ["track-position", ["bXPOW", true], [false]];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);

/**
 * @group negative tests: missing required arguments
 */
Deno.test("banq [track-position] without args", OPTS, async () => {
  const args = { rest: ["track-position"] };
  await assertRejects(
    () => cli_next(args as BanqArgs),
    Error,
  );
});

Deno.test("banq [track-position, APOW] without pool", OPTS, async () => {
  const args = { rest: ["track-position", "APOW"] };
  await assertRejects(
    () => cli_next(args as BanqArgs),
    Error,
  );
});

Deno.test(
  "banq -p P000 [track-position, APOW] without mode",
  OPTS,
  async () => {
    const args = { pool: "P000", rest: ["track-position", "APOW"] };
    await assertRejects(
      () => cli_next(args as BanqArgs),
      Error,
    );
  },
);
