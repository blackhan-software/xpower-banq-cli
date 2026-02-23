import { assertEquals } from "@std/assert";
import { ethers } from "ethers";
import ACMA_ABI from "../abi/acma-abi.json" with { type: "json" };
import { decode_log } from "./acma-events.ts";

const IFACE = new ethers.Interface(ACMA_ABI);

function make_log(
  name: string,
  args: Record<string, unknown>,
  block = 100,
  index = 0,
): ethers.Log {
  const fragment = IFACE.getEvent(name)!;
  const encoded = IFACE.encodeEventLog(fragment, Object.values(args));
  return new ethers.Log(
    {
      blockNumber: block,
      blockHash: "0x" + "00".repeat(32),
      transactionHash: "0x" + "ab".repeat(32),
      transactionIndex: 0,
      removed: false,
      address: "0x" + "11".repeat(20),
      data: encoded.data,
      topics: encoded.topics,
      index: index,
    },
    { _network: { chainId: 1n, name: "test" } } as unknown as ethers.Provider,
  );
}

/**
 * @group positive tests — decode RoleGranted
 */
Deno.test("acma-events: decode RoleGranted", () => {
  const log = make_log("RoleGranted", {
    roleId: 42n,
    account: "0x" + "AA".repeat(20),
    delay: 86400,
    since: 1700000000,
    newMember: true,
  });
  const ev = decode_log(log)!;
  assertEquals(ev.kind, "granted");
  assertEquals(ev.roleId, 42n);
  assertEquals(ev.delay, 86400);
  assertEquals(ev.since, 1700000000);
  assertEquals(ev.newMember, true);
  assertEquals(ev.block, 100);
});

/**
 * @group positive tests — decode RoleRevoked
 */
Deno.test("acma-events: decode RoleRevoked", () => {
  const log = make_log("RoleRevoked", {
    roleId: 42n,
    account: "0x" + "BB".repeat(20),
  });
  const ev = decode_log(log)!;
  assertEquals(ev.kind, "revoked");
  assertEquals(ev.roleId, 42n);
});

/**
 * @group positive tests — decode RoleLabel
 */
Deno.test("acma-events: decode RoleLabel", () => {
  const log = make_log("RoleLabel", {
    roleId: 10n,
    label: "SUPPLY_SET_TARGET_ROLE",
  });
  const ev = decode_log(log)!;
  assertEquals(ev.kind, "labeled");
  assertEquals(ev.label, "SUPPLY_SET_TARGET_ROLE");
});

/**
 * @group positive tests — decode RoleAdminChanged
 */
Deno.test("acma-events: decode RoleAdminChanged", () => {
  const log = make_log("RoleAdminChanged", {
    roleId: 5n,
    admin: 10n,
  });
  const ev = decode_log(log)!;
  assertEquals(ev.kind, "adm-set");
  assertEquals(ev.roleId, 5n);
  assertEquals(ev.admin, 10n);
});

/**
 * @group positive tests — decode RoleGuardianChanged
 */
Deno.test("acma-events: decode RoleGuardianChanged", () => {
  const log = make_log("RoleGuardianChanged", {
    roleId: 5n,
    guardian: 15n,
  });
  const ev = decode_log(log)!;
  assertEquals(ev.kind, "grd-set");
  assertEquals(ev.guardian, 15n);
});

/**
 * @group positive tests — decode RoleGrantDelayChanged
 */
Deno.test("acma-events: decode RoleGrantDelayChanged", () => {
  const log = make_log("RoleGrantDelayChanged", {
    roleId: 7n,
    delay: 3600,
    since: 1700000000,
  });
  const ev = decode_log(log)!;
  assertEquals(ev.kind, "grant·dt");
  assertEquals(ev.delay, 3600);
});

/**
 * @group positive tests — decode TargetFunctionRoleUpdated
 */
Deno.test("acma-events: decode TargetFunctionRoleUpdated", () => {
  const log = make_log("TargetFunctionRoleUpdated", {
    target: "0x" + "CC".repeat(20),
    selector: "0xaabbccdd",
    roleId: 20n,
  });
  const ev = decode_log(log)!;
  assertEquals(ev.kind, "fn-role");
  assertEquals(ev.selector, "0xaabbccdd");
  assertEquals(ev.roleId, 20n);
});

/**
 * @group positive tests — decode TargetClosed
 */
Deno.test("acma-events: decode TargetClosed", () => {
  const log = make_log("TargetClosed", {
    target: "0x" + "DD".repeat(20),
    closed: true,
  });
  const ev = decode_log(log)!;
  assertEquals(ev.kind, "closed");
  assertEquals(ev.closed, true);
});

/**
 * @group positive tests — decode OperationExecuted
 */
Deno.test("acma-events: decode OperationExecuted", () => {
  const log = make_log("OperationExecuted", {
    operationId: "0x" + "EE".repeat(32),
    nonce: 5,
  });
  const ev = decode_log(log)!;
  assertEquals(ev.kind, "op·exec");
  assertEquals(ev.nonce, 5);
});

/**
 * @group negative tests — decode unknown log returns null
 */
Deno.test("acma-events: decode unknown log returns null", () => {
  const log = new ethers.Log(
    {
      blockNumber: 100,
      blockHash: "0x" + "00".repeat(32),
      transactionHash: "0x" + "ab".repeat(32),
      transactionIndex: 0,
      removed: false,
      address: "0x" + "11".repeat(20),
      data: "0x",
      topics: ["0x" + "FF".repeat(32)],
      index: 0,
    },
    { _network: { chainId: 1n, name: "test" } } as unknown as ethers.Provider,
  );
  const ev = decode_log(log);
  assertEquals(ev, null);
});
