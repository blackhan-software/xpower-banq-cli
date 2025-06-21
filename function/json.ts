/**
 * Side-effect module: patches BigInt.prototype.toJSON and JSON.parse
 * to support bigint serialization/deserialization.
 */
// deno-lint-ignore-file no-explicit-any
const _polyfill = Symbol.for("banq.json.polyfill");
(function polyfill(parse: typeof JSON.parse) {
  if ((JSON as any)[_polyfill]) return;
  (JSON as any)[_polyfill] = true;
  JSON.parse = function (value: string) {
    return parse(value, (_, v) => {
      if (typeof v === "string" && v.match(/^[+-]?[0-9]+n$/)) {
        return BigInt(v.slice(0, -1));
      }
      return v;
    });
  };
  if (typeof (BigInt.prototype as any).toJSON !== "function") {
    (BigInt.prototype as any).toJSON = function () {
      return `${this.toString()}n`;
    };
  }
})(JSON.parse);
