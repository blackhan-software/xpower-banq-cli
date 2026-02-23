import type { RunVersion } from "../../../arg/types.ts";

import ACMA_v10a from "./version/acma-abi.v10a.json" with { type: "json" };
import ACMA_v10b from "./version/acma-abi.v10b.json" with { type: "json" };
import POOL_v10a from "./version/pool-abi.v10a.json" with { type: "json" };
import POOL_v10b from "./version/pool-abi.v10b.json" with { type: "json" };
import VAULT_v10a from "./version/vault-abi.v10a.json" with { type: "json" };
import VAULT_v10b from "./version/vault-abi.v10b.json" with { type: "json" };
import ORACLE_v10a from "./version/oracle-abi.v10a.json" with { type: "json" };
import ORACLE_v10b from "./version/oracle-abi.v10b.json" with { type: "json" };
import POSITION_v10a from "./version/position-abi.v10a.json" with {
  type: "json",
};
import POSITION_v10b from "./version/position-abi.v10b.json" with {
  type: "json",
};

export const acma_abi = (v: RunVersion) => v === "v10a" ? ACMA_v10a : ACMA_v10b;
export const pool_abi = (v: RunVersion) => v === "v10a" ? POOL_v10a : POOL_v10b;
export const vault_abi = (v: RunVersion) =>
  v === "v10a" ? VAULT_v10a : VAULT_v10b;
export const oracle_abi = (v: RunVersion) =>
  v === "v10a" ? ORACLE_v10a : ORACLE_v10b;
export const position_abi = (v: RunVersion) =>
  v === "v10a" ? POSITION_v10a : POSITION_v10b;
