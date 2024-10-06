import { type BanqArgs, cli_banq } from "./banq.ts";

Deno.bench("cli [pass]", async () => {
  for await (const _ of cli_banq({ rest: ["pass"] } as BanqArgs)) {
    // pass
  }
});
Deno.bench("cli [pass, 1]", async () => {
  for await (const _ of cli_banq({ rest: ["pass", 1] } as BanqArgs)) {
    // pass
  }
});
Deno.bench("cli [pass, 1 ,2]", async () => {
  for await (const _ of cli_banq({ rest: ["pass", 1, 2] } as BanqArgs)) {
    // pass
  }
});
Deno.bench("cli [pass, 1, 2, 3]", async () => {
  for await (const _ of cli_banq({ rest: ["pass", 1, 2, 3] } as BanqArgs)) {
    // pass
  }
});
