import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export function opt_provider_urls(
  args?: Partial<Pick<BanqArgs, "provider_url">>,
): string[] {
  const raw = args?.provider_url ?? Deno.env.get("PROVIDER_URL");
  if (!raw) {
    throw new ArgumentError("missing PROVIDER_URL");
  }
  return parseProviderUrls(raw);
}

export function parseProviderUrls(raw: string): string[] {
  const urls = raw.split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => {
      if (!URL.canParse(s)) {
        throw new ArgumentError(`invalid provider-url: ${s}`);
      }
      return new URL(s).toString();
    });
  if (urls.length === 0) {
    throw new ArgumentError("no valid provider URLs");
  }
  return urls;
}
