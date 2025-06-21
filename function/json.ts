// deno-lint-ignore-file no-explicit-any
(function polyfill(parse: typeof JSON.parse) {
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
