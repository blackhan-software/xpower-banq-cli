#!/usr/bin/env python3
###############################################################################
"""
deno-compat: @ledgerhq/* ESM fix

@ledgerhq packages export "import" -> lib-es/*.js which use extensionless
relative imports (e.g. from "./errors"). Deno strictly requires .js
extensions in ESM, causing ERR_MODULE_NOT_FOUND. Removing the "import"
condition forces Deno (and Node) to use the CJS entry via "default".
"""
import json, sys

###############################################################################

for path in sys.argv[1:]:
    with open(path) as f:
        d = json.load(f)
    changed = False
    for key in d.get("exports", {}):
        v = d["exports"][key]
        if isinstance(v, dict) and "import" in v:
            del v["import"]
            changed = True
    if changed:
        with open(path, "w") as f:
            json.dump(d, f, indent=2, ensure_ascii=False)
            f.write("\n")

###############################################################################
###############################################################################
