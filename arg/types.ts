export type Argument = string | number | bigint | boolean;

export class ArgumentError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ArgumentError";
  }
}
export type Page = {
  page: number | null;
  page_size: number | null;
  page_step: number | null;
  hist_size: number | null;
};
export type Mode =
  | "supply"
  | "borrow";
export const Mode = {
  cap(mode: Mode) {
    return mode === "supply" ? "Supply" : "Borrow";
  },
};
export type RunVersion =
  | "v10a"
  | "v10b"
  | "v10c";
