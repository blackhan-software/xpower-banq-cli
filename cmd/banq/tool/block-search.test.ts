import { assertEquals, assertRejects } from "@std/assert";
import { blockSearch } from "./block-search.ts";

function mock_provider(
  code_at: Record<number, string>,
  latest: number,
) {
  return {
    getCode: (_address: string, block: number | "latest") => {
      const b = block === "latest" ? latest : block;
      return Promise.resolve(code_at[b] ?? "0x");
    },
    getBlockNumber: () => Promise.resolve(latest),
  };
}

Deno.test("blockSearch: contract deployed at block 0", async () => {
  const codes: Record<number, string> = {};
  for (let i = 0; i <= 10; i++) codes[i] = "0x60";
  const provider = mock_provider(codes, 10);
  // deno-lint-ignore no-explicit-any
  const block = await blockSearch(provider as any, "0xABC");
  assertEquals(block, 0);
});

Deno.test("blockSearch: contract deployed at latest block", async () => {
  const provider = mock_provider(
    { 100: "0x60" },
    100,
  );
  // deno-lint-ignore no-explicit-any
  const block = await blockSearch(provider as any, "0xABC");
  assertEquals(block, 100);
});

Deno.test("blockSearch: contract deployed mid-range", async () => {
  const codes: Record<number, string> = {};
  for (let i = 50; i <= 100; i++) codes[i] = "0x60";
  const provider = mock_provider(codes, 100);
  // deno-lint-ignore no-explicit-any
  const block = await blockSearch(provider as any, "0xABC");
  assertEquals(block, 50);
});

Deno.test("blockSearch: not deployed throws", async () => {
  const provider = mock_provider({}, 100);
  await assertRejects(
    // deno-lint-ignore no-explicit-any
    () => blockSearch(provider as any, "0xABC"),
    Error,
    "not deployed",
  );
});

Deno.test("blockSearch: custom label in error", async () => {
  const provider = mock_provider({}, 100);
  await assertRejects(
    // deno-lint-ignore no-explicit-any
    () => blockSearch(provider as any, "0xABC", "POSITION"),
    Error,
    "POSITION not deployed",
  );
});
