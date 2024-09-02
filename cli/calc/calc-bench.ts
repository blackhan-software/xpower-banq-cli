import { type CalcArgs, cli_calc } from "./calc.ts";

Deno.bench("calc [add, 1, 2]", async () => {
  for await (const _ of cli_calc({ rest: ["add", 1, 2] } as CalcArgs)) {
    // pass
  }
});
Deno.bench("calc [sub, 1, 2]", async () => {
  for await (const _ of cli_calc({ rest: ["sub", 1, 2] } as CalcArgs)) {
    // pass
  }
});
Deno.bench("calc [mul, 1, 2]", async () => {
  for await (const _ of cli_calc({ rest: ["mul", 1, 2] } as CalcArgs)) {
    // pass
  }
});
Deno.bench("calc [div, 1, 2]", async () => {
  for await (const _ of cli_calc({ rest: ["div", 1, 2] } as CalcArgs)) {
    // pass
  }
});
