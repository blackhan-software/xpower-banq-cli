import { assertEquals, assertThrows } from "@std/assert";
import { opt_contract_run } from "./opt-contract-run.ts";
import { ArgumentError } from "./types.ts";

const OPTS = { permissions: { env: true } };

Deno.test("opt_contract_run [v10c]", OPTS, () => {
  assertEquals(opt_contract_run({ contract_run: "v10c" }), {
    contract_run: "v10c",
  });
});
Deno.test("opt_contract_run [V10C] case-insensitive", OPTS, () => {
  assertEquals(
    opt_contract_run({ contract_run: "V10C" as "v10c" }),
    { contract_run: "v10c" },
  );
});
Deno.test("opt_contract_run [v11b]", OPTS, () => {
  assertEquals(opt_contract_run({ contract_run: "v11b" }), {
    contract_run: "v11b",
  });
});
Deno.test("opt_contract_run [invalid] throws", OPTS, () => {
  assertThrows(
    () => opt_contract_run({ contract_run: "v99z" as "v11b" }),
    ArgumentError,
  );
});
Deno.test("opt_contract_run [] env fallback", OPTS, () => {
  // CONTRACT_RUN is set via --env flags in test
  const result = opt_contract_run();
  assertEquals(typeof result.contract_run, "string");
});
