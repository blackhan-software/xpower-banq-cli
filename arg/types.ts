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
};
