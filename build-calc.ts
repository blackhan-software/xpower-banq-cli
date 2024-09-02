const status = await build({
  os: Deno.build.os,
});
function build({ os }: {
  os: string;
}) {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", `build-calc-${os}`],
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });
  const process = cmd.spawn();
  return process.status;
}
Deno.exit(status.code);
