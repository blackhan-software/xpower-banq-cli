import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export function opt_provider_url(
  args?: Partial<Pick<BanqArgs, "provider_url">>,
): string {
  const arg = args?.provider_url ?? Deno.env.get("PROVIDER_URL");
  if (arg && URL.canParse(arg)) {
    return new URL(arg).toString();
  }
  throw new ArgumentError(`invalid provider-url: ${arg}`);
}
