import type { SignerOptions as PKSignerOptions } from "./wallet.ts";
import type { SignerOptions as HWSignerOptions } from "./ledger.ts";
import { wallet as pk_wallet } from "./wallet.ts";
import { wallet as ledger_hw } from "./ledger.ts";
import type { ethers } from "ethers";

export type SignerOptions<
  T extends boolean,
> = T extends true ? HWSignerOptions : PKSignerOptions;

export type SignerAccount = {
  signer: ethers.Signer;
  account: string;
};

/**
 * @dev https://docs.ethers.org/v6/api/wallet/#Wallet
 * @returns a signer-wallet and its account-address
 */
export function wallet<T extends boolean>(
  options?: SignerOptions<T> & { ledger?: T },
): Promise<SignerAccount> {
  if (options?.ledger) {
    return ledger_hw(options as HWSignerOptions);
  } else {
    return pk_wallet(options as PKSignerOptions);
  }
}
