import { assertEquals } from "@std/assert";
import { makeError } from "ethers";
import { revertReason } from "./revert-reason.ts";

function callException({
  reason,
  revert,
}: {
  reason: string | null;
  revert: { signature: string; name: string; args: unknown[] } | null;
}) {
  return makeError("revert", "CALL_EXCEPTION", {
    action: "call",
    data: "0x",
    reason,
    transaction: {
      to: "0x0000000000000000000000000000000000000000",
      data: "0x",
    },
    invocation: null,
    revert,
  });
}

/**
 * @group revertReason
 */
Deno.test("revertReason: custom error includes args", () => {
  const e = callException({
    reason: "InsufficientLiquidity(uint256)",
    revert: {
      signature: "InsufficientLiquidity(uint256)",
      name: "InsufficientLiquidity",
      args: [1_000_000_000n],
    },
  });
  assertEquals(revertReason(e), "InsufficientLiquidity(1000000000)");
});
Deno.test("revertReason: builtin error uses reason", () => {
  const e = callException({
    reason: "insufficient balance",
    revert: {
      signature: "Error(string)",
      name: "Error",
      args: ["insufficient balance"],
    },
  });
  assertEquals(revertReason(e), "insufficient balance");
});
Deno.test("revertReason: no revert falls back to shortMessage", () => {
  const e = callException({ reason: null, revert: null });
  assertEquals(revertReason(e), e.shortMessage);
});
