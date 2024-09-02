import { assertEquals, assertThrows } from "@std/assert";
import { opt_contract_run } from "./opt-contract-run.ts";
import { ArgumentError } from "./types.ts";

const OPTS = { permissions: { env: true } };

Deno.test("opt_contract_run [v10a]", OPTS, () => {
  assertEquals(opt_contract_run({ contract_run: "v10a" }), {
    contract_run: "v10a",
  });
});
Deno.test("opt_contract_run [v10b]", OPTS, () => {
  assertEquals(opt_contract_run({ contract_run: "v10b" }), {
    contract_run: "v10b",
  });
});
Deno.test("opt_contract_run [V10A] case-insensitive", OPTS, () => {
  assertEquals(
    opt_contract_run({ contract_run: "V10A" as "v10a" }),
    { contract_run: "v10a" },
  );
});
Deno.test("opt_contract_run [invalid] throws", OPTS, () => {
  assertThrows(
    () => opt_contract_run({ contract_run: "v99z" as "v10a" }),
    ArgumentError,
  );
});
Deno.test("opt_contract_run [] env fallback", OPTS, () => {
  // CONTRACT_RUN is set via --env flags in test
  const result = opt_contract_run();
  assertEquals(typeof result.contract_run, "string");
});
