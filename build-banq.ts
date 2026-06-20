import { parseArgs } from "./function/parse-args.ts";
import { assert } from "./function/assert.ts";
const { _, network } = parseArgs(Deno.args, {
  string: ["network"],
});

assert(network, "Missing network");
assert(
  ["mainnet", "testnet"].includes(network),
  `Invalid network: ${network}`,
);

const status = await build({
  arch: Deno.build.arch,
  os: Deno.build.os,
  network,
});
function build({ arch, os, network }: {
  arch: string;
  network: string;
  os: string;
}) {
  if (network === undefined) {
    network = "mainnet";
  }
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", `build-banq-${os}-${arch}-${network}`],
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });
  const process = cmd.spawn();
  return process.status;
}
Deno.exit(status.code);
