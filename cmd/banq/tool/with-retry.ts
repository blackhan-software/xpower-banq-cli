import { isCallException } from "ethers";
import { sleep } from "../../../function/sleep.ts";

export type RetryOptions = {
  maxRetry: number;
  delayMs: number;
};

export async function withRetry<T>(
  callable: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const { maxRetry: max, delayMs: delay_ms } = options;
  for (let attempt = 0; attempt <= max; attempt++) {
    try {
      return await callable(attempt);
    } catch (e) {
      if (isCallException(e)) {
        throw e;
      }
      if (attempt >= max) {
        throw e;
      }
      await sleep(delay_ms);
    }
  }
  throw new Error("unreachable");
}
