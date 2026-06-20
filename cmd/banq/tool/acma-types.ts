/**
 * ACMA event kinds (display abbreviations from spec).
 */
export type AcmaEventKind =
  | "granted"
  | "revoked"
  | "labeled"
  | "adm-set"
  | "grd-set"
  | "grant·dt"
  | "fn-role"
  | "tgt·dt"
  | "closed"
  | "op·sched"
  | "op·exec"
  | "op·cancel";

/**
 * Role tier: exec, admin, guard, or system (builtin).
 */
export type RoleTier = "exe" | "adm" | "grd" | "sys";

/**
 * Decoded ACMA event (stored in cache).
 */
export type AcmaEvent = {
  block: number;
  logIndex: number;
  txHash: string;
  kind: AcmaEventKind;
  /** Fields depend on event kind */
  roleId?: bigint;
  account?: bigint;
  delay?: number;
  since?: number;
  newMember?: boolean;
  label?: string;
  admin?: bigint;
  guardian?: bigint;
  target?: bigint;
  selector?: string;
  closed?: boolean;
  operationId?: string;
  nonce?: number;
  schedule?: number;
  caller?: bigint;
  data?: string;
};

/**
 * Reconstructed role state.
 */
export type RoleState = {
  id: bigint;
  label: string;
  tier: RoleTier;
  adminRole: bigint;
  guardRole: bigint;
  grantDelay: number;
  grantDelaySince: number;
  members: Map<bigint, MemberState>;
};

/**
 * Member grant state.
 */
export type MemberState = {
  execDelay: number;
  since: number;
};

/**
 * Target contract state.
 */
export type TargetState = {
  address: bigint;
  closed: boolean;
  adminDelay: number;
  adminDelaySince: number;
  functions: Map<string, bigint>; // selector => roleId
};

/**
 * Full reconstructed ACMA state.
 */
export type AcmaState = {
  roles: Map<bigint, RoleState>;
  targets: Map<bigint, TargetState>;
  events: AcmaEvent[];
};

/**
 * Cache file JSON format.
 */
export type AcmaCacheData = {
  chainId: number;
  acma: string;
  fromBlock: number;
  toBlock: number;
  events: AcmaEventJson[];
};

/**
 * JSON-serializable event (bigints as strings).
 */
export type AcmaEventJson = {
  block: number;
  logIndex: number;
  txHash: string;
  kind: AcmaEventKind;
  roleId?: string;
  account?: string;
  delay?: number;
  since?: number;
  newMember?: boolean;
  label?: string;
  admin?: string;
  guardian?: string;
  target?: string;
  selector?: string;
  closed?: boolean;
  operationId?: string;
  nonce?: number;
  schedule?: number;
  caller?: string;
  data?: string;
};

/**
 * ACMA sub-command names.
 */
export const ACMA_SUBCMDS = [
  "show",
  "roles",
  "members",
  "targets",
  "hierarchy",
  "delays",
  "logs",
] as const;
export type AcmaSubcommand = (typeof ACMA_SUBCMDS)[number];

/** ADMIN_ROLE id = 0 */
export const ADMIN_ROLE = 0n;
/** PUBLIC_ROLE id = 2^64 - 1 */
export const PUBLIC_ROLE = (1n << 64n) - 1n;
