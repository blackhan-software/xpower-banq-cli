import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";

export function uuidv5(
  name: string,
  namespace: string = "60e81555-ea69-443f-ba7f-fd1963239c4a",
): string {
  const my_bytes = Buffer.from(name);
  const ns_bytes = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const hash = createHash("sha1").update(ns_bytes).update(my_bytes).digest();
  hash[8] = (hash[8] & 0x3f) | 0x80; // variant RFC4122
  hash[6] = (hash[6] & 0x0f) | 0x50; // version 5
  const h = hash.toString("hex").slice(0, 32);
  const h1 = h.slice(0, 8);
  const h2 = h.slice(8, 12);
  const h3 = h.slice(12, 16);
  const h4 = h.slice(16, 20);
  const h5 = h.slice(20, 32);
  return `${h1}-${h2}-${h3}-${h4}-${h5}`;
}
export default uuidv5;
