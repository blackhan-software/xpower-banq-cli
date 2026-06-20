import type { RunVersion } from "../../../arg/types.ts";

import ACMA_v10a from "./version/acma-abi.v10a.json" with { type: "json" };
import ACMA_v10b from "./version/acma-abi.v10b.json" with { type: "json" };
import ACMA_v10c from "./version/acma-abi.v10c.json" with { type: "json" };

import CAPS_v10c from "./version/caps-abi.v10c.json" with { type: "json" };
import POOL_v10a from "./version/pool-abi.v10a.json" with { type: "json" };
import POOL_v10b from "./version/pool-abi.v10b.json" with { type: "json" };
import POOL_v10c from "./version/pool-abi.v10c.json" with { type: "json" };

import VAULT_v10a from "./version/vault-abi.v10a.json" with { type: "json" };
import VAULT_v10b from "./version/vault-abi.v10b.json" with { type: "json" };
import VAULT_v10c from "./version/vault-abi.v10c.json" with { type: "json" };

import ORACLE_v10a from "./version/oracle-abi.v10a.json" with { type: "json" };
import ORACLE_v10b from "./version/oracle-abi.v10b.json" with { type: "json" };
import ORACLE_v10c from "./version/oracle-abi.v10c.json" with { type: "json" };

import POSITION_v10a from "./version/position-abi.v10a.json" with {
  type: "json",
};
import POSITION_v10b from "./version/position-abi.v10b.json" with {
  type: "json",
};
import POSITION_v10c from "./version/position-abi.v10c.json" with {
  type: "json",
};

export const acma_abi = (v: RunVersion) => {
  switch (v) {
    case "v10a":
      return ACMA_v10a;
    case "v10b":
      return ACMA_v10b;
    case "v10c":
      return ACMA_v10c;
  }
};
export const pool_abi = (v: RunVersion) => {
  switch (v) {
    case "v10a":
      return POOL_v10a;
    case "v10b":
      return POOL_v10b;
    case "v10c":
      return POOL_v10c;
  }
};
export const caps_abi = (v: RunVersion) => {
  switch (v) {
    case "v10a":
    case "v10b":
    case "v10c":
      return CAPS_v10c;
  }
};
export const vault_abi = (v: RunVersion) => {
  switch (v) {
    case "v10a":
      return VAULT_v10a;
    case "v10b":
      return VAULT_v10b;
    case "v10c":
      return VAULT_v10c;
  }
};
export const oracle_abi = (v: RunVersion) => {
  switch (v) {
    case "v10a":
      return ORACLE_v10a;
    case "v10b":
      return ORACLE_v10b;
    case "v10c":
      return ORACLE_v10c;
  }
};
export const position_abi = (v: RunVersion) => {
  switch (v) {
    case "v10a":
      return POSITION_v10a;
    case "v10b":
      return POSITION_v10b;
    case "v10c":
      return POSITION_v10c;
  }
};
