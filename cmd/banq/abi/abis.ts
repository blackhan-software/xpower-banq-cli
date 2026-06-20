import type { RunVersion } from "../../../arg/types.ts";

import ACMA_v11a from "./version/acma-abi.v11a.json" with { type: "json" };
import ACMA_v11b from "./version/acma-abi.v11b.json" with { type: "json" };
import ACMA_v11c from "./version/acma-abi.v11c.json" with { type: "json" };

import CAPS_v11a from "./version/caps-abi.v11a.json" with { type: "json" };
import CAPS_v11b from "./version/caps-abi.v11b.json" with { type: "json" };
import CAPS_v11c from "./version/caps-abi.v11c.json" with { type: "json" };
import POLS_v11a from "./version/pols-abi.v11a.json" with { type: "json" };
import POLS_v11b from "./version/pols-abi.v11b.json" with { type: "json" };
import POLS_v11c from "./version/pols-abi.v11c.json" with { type: "json" };
import POOL_v11a from "./version/pool-abi.v11a.json" with { type: "json" };
import POOL_v11b from "./version/pool-abi.v11b.json" with { type: "json" };
import POOL_v11c from "./version/pool-abi.v11c.json" with { type: "json" };

import VAULT_v11a from "./version/vault-abi.v11a.json" with { type: "json" };
import VAULT_v11b from "./version/vault-abi.v11b.json" with { type: "json" };
import VAULT_v11c from "./version/vault-abi.v11c.json" with { type: "json" };

import ORACLE_v11a from "./version/oracle-abi.v11a.json" with { type: "json" };
import ORACLE_v11b from "./version/oracle-abi.v11b.json" with { type: "json" };
import ORACLE_v11c from "./version/oracle-abi.v11c.json" with { type: "json" };

import POSITION_v11a from "./version/position-abi.v11a.json" with {
  type: "json",
};
import POSITION_v11b from "./version/position-abi.v11b.json" with {
  type: "json",
};
import POSITION_v11c from "./version/position-abi.v11c.json" with {
  type: "json",
};

export const acma_abi = (v: RunVersion) => {
  switch (v) {
    case "v11a":
      return ACMA_v11a;
    case "v11b":
      return ACMA_v11b;
    case "v11c":
      return ACMA_v11c;
  }
};
export const pool_abi = (v: RunVersion) => {
  switch (v) {
    case "v11a":
      return POOL_v11a;
    case "v11b":
      return POOL_v11b;
    case "v11c":
      return POOL_v11c;
  }
};
export const caps_abi = (v: RunVersion) => {
  switch (v) {
    case "v11a":
      return CAPS_v11a;
    case "v11b":
      return CAPS_v11b;
    case "v11c":
      return CAPS_v11c;
  }
};
export const pols_abi = (v: RunVersion) => {
  switch (v) {
    case "v11a":
      return POLS_v11a;
    case "v11b":
      return POLS_v11b;
    case "v11c":
      return POLS_v11c;
  }
};
export const vault_abi = (v: RunVersion) => {
  switch (v) {
    case "v11a":
      return VAULT_v11a;
    case "v11b":
      return VAULT_v11b;
    case "v11c":
      return VAULT_v11c;
  }
};
export const oracle_abi = (v: RunVersion) => {
  switch (v) {
    case "v11a":
      return ORACLE_v11a;
    case "v11b":
      return ORACLE_v11b;
    case "v11c":
      return ORACLE_v11c;
  }
};
export const position_abi = (v: RunVersion) => {
  switch (v) {
    case "v11a":
      return POSITION_v11a;
    case "v11b":
      return POSITION_v11b;
    case "v11c":
      return POSITION_v11c;
  }
};
