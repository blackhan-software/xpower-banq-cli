import { ethers } from "ethers";
import ACMA_ABI from "../abi/acma-abi.json" with { type: "json" };
import type { AcmaEvent, AcmaEventKind } from "./acma-types.ts";
import { blockSearch } from "./block-search.ts";

const IFACE = new ethers.Interface(ACMA_ABI);

/**
 * Event name → display kind mapping.
 */
const KIND_MAP: Record<string, AcmaEventKind> = {
  RoleGranted: "granted",
  RoleRevoked: "revoked",
  RoleLabel: "labeled",
  RoleAdminChanged: "adm-set",
  RoleGuardianChanged: "grd-set",
  RoleGrantDelayChanged: "grant·dt",
  TargetFunctionRoleUpdated: "fn-role",
  TargetAdminDelayUpdated: "tgt·dt",
  TargetClosed: "closed",
  OperationScheduled: "op·sched",
  OperationExecuted: "op·exec",
  OperationCanceled: "op·cancel",
};

function try_parse_log(log: ethers.Log): ethers.LogDescription | null {
  try {
    return IFACE.parseLog({
      topics: log.topics as string[],
      data: log.data,
    });
  } catch {
    return null;
  }
}

/**
 * Decode raw ethers log into an AcmaEvent.
 */
export function decode_log(log: ethers.Log): AcmaEvent | null {
  const parsed = try_parse_log(log);
  if (!parsed) {
    return null;
  }
  const kind = KIND_MAP[parsed.name];
  if (!kind) {
    return null;
  }
  const base: AcmaEvent = {
    block: log.blockNumber,
    logIndex: log.index,
    txHash: log.transactionHash,
    kind,
  };
  switch (parsed.name) {
    case "RoleGranted":
      return {
        ...base,
        roleId: BigInt(parsed.args.roleId),
        account: BigInt(parsed.args.account),
        delay: Number(parsed.args.delay),
        since: Number(parsed.args.since),
        newMember: parsed.args.newMember,
      };
    case "RoleRevoked":
      return {
        ...base,
        roleId: BigInt(parsed.args.roleId),
        account: BigInt(parsed.args.account),
      };
    case "RoleLabel":
      return {
        ...base,
        roleId: BigInt(parsed.args.roleId),
        label: parsed.args.label,
      };
    case "RoleAdminChanged":
      return {
        ...base,
        roleId: BigInt(parsed.args.roleId),
        admin: BigInt(parsed.args.admin),
      };
    case "RoleGuardianChanged":
      return {
        ...base,
        roleId: BigInt(parsed.args.roleId),
        guardian: BigInt(parsed.args.guardian),
      };
    case "RoleGrantDelayChanged":
      return {
        ...base,
        roleId: BigInt(parsed.args.roleId),
        delay: Number(parsed.args.delay),
        since: Number(parsed.args.since),
      };
    case "TargetFunctionRoleUpdated":
      return {
        ...base,
        target: BigInt(parsed.args.target),
        selector: parsed.args.selector,
        roleId: BigInt(parsed.args.roleId),
      };
    case "TargetAdminDelayUpdated":
      return {
        ...base,
        target: BigInt(parsed.args.target),
        delay: Number(parsed.args.delay),
        since: Number(parsed.args.since),
      };
    case "TargetClosed":
      return {
        ...base,
        target: BigInt(parsed.args.target),
        closed: parsed.args.closed,
      };
    case "OperationScheduled":
      return {
        ...base,
        operationId: parsed.args.operationId,
        nonce: Number(parsed.args.nonce),
        schedule: Number(parsed.args.schedule),
        caller: BigInt(parsed.args.caller),
        target: BigInt(parsed.args.target),
        data: parsed.args.data,
      };
    case "OperationExecuted":
      return {
        ...base,
        operationId: parsed.args.operationId,
        nonce: Number(parsed.args.nonce),
      };
    case "OperationCanceled":
      return {
        ...base,
        operationId: parsed.args.operationId,
        nonce: Number(parsed.args.nonce),
      };
    default:
      return null;
  }
}

/** Default maximum block range per getLogs request. */
export const MAX_BLOCKS_DEFAULT = 2000;

/**
 * Fetch ACMA event logs from the provider in the given block range.
 * Automatically chunks requests to stay within `max_blocks` per call.
 */
export async function fetch_logs(
  provider: ethers.Provider,
  acma_address: string,
  from_block: number,
  to_block: number | "latest",
  max_blocks: number = MAX_BLOCKS_DEFAULT,
  onBlock?: (cursor: number, from: number, to: number) => void,
  onBatch?: (events: AcmaEvent[], scanned_to: number) => void,
): Promise<AcmaEvent[]> {
  const topics = [
    IFACE.getEvent("RoleGranted")!.topicHash,
    IFACE.getEvent("RoleRevoked")!.topicHash,
    IFACE.getEvent("RoleLabel")!.topicHash,
    IFACE.getEvent("RoleAdminChanged")!.topicHash,
    IFACE.getEvent("RoleGuardianChanged")!.topicHash,
    IFACE.getEvent("RoleGrantDelayChanged")!.topicHash,
    IFACE.getEvent("TargetFunctionRoleUpdated")!.topicHash,
    IFACE.getEvent("TargetAdminDelayUpdated")!.topicHash,
    IFACE.getEvent("TargetClosed")!.topicHash,
    IFACE.getEvent("OperationScheduled")!.topicHash,
    IFACE.getEvent("OperationExecuted")!.topicHash,
    IFACE.getEvent("OperationCanceled")!.topicHash,
  ];
  const end = typeof to_block === "number" ? to_block : undefined;
  // resolve "latest" once so we can chunk numerically
  const resolved_end = end ??
    await provider.getBlockNumber();
  const events: AcmaEvent[] = [];
  let cursor = from_block;
  while (cursor <= resolved_end) {
    onBlock?.(cursor, from_block, resolved_end);
    const chunk_end = Math.min(cursor + max_blocks - 1, resolved_end);
    const filter = {
      address: acma_address,
      fromBlock: cursor,
      toBlock: chunk_end,
      topics: [topics],
    };
    const raw_logs = await provider.getLogs(filter);
    for (const log of raw_logs) {
      const ev = decode_log(log);
      if (ev) {
        events.push(ev);
      }
    }
    onBatch?.(events, chunk_end);
    cursor = chunk_end + 1;
  }
  events.sort((a, b) => a.block - b.block || a.logIndex - b.logIndex);
  return events;
}

/**
 * Binary search for the deployment block of the ACMA contract.
 * Returns the earliest block where the contract has code.
 */
export function find_deploy_block(
  provider: ethers.Provider,
  acma_address: string,
): Promise<number> {
  return blockSearch(provider, acma_address, "ACMA contract");
}

/**
 * Get the ethers Interface for topic filter construction.
 */
export function acma_interface(): ethers.Interface {
  return IFACE;
}
