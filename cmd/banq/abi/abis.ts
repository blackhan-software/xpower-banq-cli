import type { RunVersion } from "../../../arg/types.ts";

import ACMA_v10b from "./version/acma-abi.v10b.json" with { type: "json" };
import ACMA_v10c from "./version/acma-abi.v10c.json" with { type: "json" };
import ACMA_v11a from "./version/acma-abi.v11a.json" with { type: "json" };

import CAPS_v10c from "./version/caps-abi.v10c.json" with { type: "json" };
import CAPS_v11a from "./version/caps-abi.v11a.json" with { type: "json" };
import POLS_v11a from "./version/pols-abi.v11a.json" with { type: "json" };
import POOL_v10b from "./version/pool-abi.v10b.json" with { type: "json" };
import POOL_v10c from "./version/pool-abi.v10c.json" with { type: "json" };
import POOL_v11a from "./version/pool-abi.v11a.json" with { type: "json" };

import VAULT_v10b from "./version/vault-abi.v10b.json" with { type: "json" };
import VAULT_v10c from "./version/vault-abi.v10c.json" with { type: "json" };
import VAULT_v11a from "./version/vault-abi.v11a.json" with { type: "json" };

import ORACLE_v10b from "./version/oracle-abi.v10b.json" with { type: "json" };
import ORACLE_v10c from "./version/oracle-abi.v10c.json" with { type: "json" };
import ORACLE_v11a from "./version/oracle-abi.v11a.json" with { type: "json" };

import POSITION_v10b from "./version/position-abi.v10b.json" with {
  type: "json",
};
import POSITION_v10c from "./version/position-abi.v10c.json" with {
  type: "json",
};
import POSITION_v11a from "./version/position-abi.v11a.json" with {
  type: "json",
};

export const acma_abi = (v: RunVersion) => {
  switch (v) {
    case "v10b":
      return ACMA_v10b;
    case "v10c":
      return ACMA_v10c;
    case "v11a":
      return ACMA_v11a;
  }
};
export const pool_abi = (v: RunVersion) => {
  switch (v) {
    case "v10b":
      return POOL_v10b;
    case "v10c":
      return POOL_v10c;
    case "v11a":
      return POOL_v11a;
  }
};
export const caps_abi = (v: RunVersion) => {
  switch (v) {
    case "v10b":
    case "v10c":
      return CAPS_v10c;
    case "v11a":
      return CAPS_v11a;
  }
};
export const pols_abi = (v: RunVersion) => {
  switch (v) {
    case "v11a":
      return POLS_v11a;
  }
};
export const vault_abi = (v: RunVersion) => {
  switch (v) {
    case "v10b":
      return VAULT_v10b;
    case "v10c":
      return VAULT_v10c;
    case "v11a":
      return VAULT_v11a;
  }
};
export const oracle_abi = (v: RunVersion) => {
  switch (v) {
    case "v10b":
      return ORACLE_v10b;
    case "v10c":
      return ORACLE_v10c;
    case "v11a":
      return ORACLE_v11a;
  }
};
export const position_abi = (v: RunVersion) => {
  switch (v) {
    case "v10b":
      return POSITION_v10b;
    case "v10c":
      return POSITION_v10c;
    case "v11a":
      return POSITION_v11a;
  }
};
