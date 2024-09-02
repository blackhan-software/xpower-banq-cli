import type { ethers } from "ethers";

export type SignerAccount = {
  signer: ethers.Signer;
  account: string;
};
