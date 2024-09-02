import Eth, { ledgerService } from "@ledgerhq/hw-app-eth";
import type { LedgerTransport } from "./hw-ledger-types.ts";

import {
  AbstractSigner,
  assertArgument,
  getAccountPath,
  getAddress,
  hexlify,
  resolveAddress,
  Signature,
  toUtf8Bytes,
  Transaction,
  TypedDataEncoder,
} from "ethers";

import type {
  Provider,
  SignatureLike,
  TransactionLike,
  TransactionRequest,
  TypedDataDomain,
  TypedDataField,
} from "ethers";

/**
 * A **LedgerSigner** provides access to a Ledger hardware wallet.
 */
export class LedgerSigner extends AbstractSigner {
  // promise that resolves to a created transport
  private _transport: Promise<LedgerTransport>;
  // hierarchical deterministic path
  private _path: string;

  /**
   * Create a new **LedgerSigner** connected to the device over the
   * %%transport%% and optionally connected to the blockchain - via
   * the %%provider%%.
   */
  constructor(
    transport: LedgerTransport,
    provider?: null | Provider,
    path?: string | number,
  ) {
    assertArgument(
      transport && typeof transport == "object" ||
        transport && typeof transport == "function",
      "invalid transport",
      "transport",
      transport,
    );
    super(provider);
    ///
    /// dereference package imports that use default export
    ///
    if ("default" in transport) {
      transport = transport.default;
    }
    ///
    /// if transport has not been created, then create it
    ///
    if (typeof (transport.create) == "function") {
      transport = transport.create();
    }
    this._transport = Promise.resolve(transport);
    this._path = LedgerSigner.getPath(path);
  }

  /** HD path for this account */
  get path(): string {
    return this._path;
  }

  connect(provider?: null | Provider): LedgerSigner {
    const [transport, path] = [this._transport, this._path];
    return new LedgerSigner(transport, provider, path);
  }

  /**
   * Returns a new LedgerSigner connected via the same transport
   * and provider, but using the account at the HD %%path%%.
   */
  getSigner(path?: string | number): LedgerSigner {
    return new LedgerSigner(this._transport, this.provider, path);
  }

  async getAddress(): Promise<string> {
    const transport = await this._transport;
    const eth = new Eth.default(transport);
    const { address } = await eth.getAddress(
      this._path,
    );
    return getAddress(address);
  }

  async signTransaction(tx_req: TransactionRequest): Promise<string> {
    const tx = Transaction.from(tx_req as TransactionLike<string>);
    const tx_raw = tx.unsignedSerialized.substring(2);
    const [load_config, resolution_config] = [{}, {}];
    const resolution = await ledgerService.resolveTransaction(
      tx_raw,
      load_config,
      resolution_config,
    );
    ///
    /// ask ledger to sign raw transaction
    ///
    const transport = await this._transport;
    const eth = new Eth.default(transport);
    const sig = await eth.signTransaction(
      this._path,
      tx_raw,
      resolution,
    );
    ///
    /// normalize signature for ethers
    ///
    sig.r = `0x${sig.r}`;
    sig.s = `0x${sig.s}`;
    sig.v = `0x${sig.v}`;
    ///
    /// update transaction with signature
    ///
    tx.signature = sig;
    return tx.serialized;
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    if (typeof message === "string") {
      message = toUtf8Bytes(message);
    }
    const transport = await this._transport;
    const eth = new Eth.default(transport);
    const sig = await eth.signPersonalMessage(
      this._path,
      hexlify(message).substring(2),
    );
    ///
    /// normalize signature for ethers
    ///
    sig.r = `0x${sig.r}`;
    sig.s = `0x${sig.s}`;
    ///
    /// serialize signature
    ///
    return Signature.from(sig).serialized;
  }

  async signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, string | number | bigint>,
  ): Promise<string> {
    ///
    /// populate any ENS names
    ///
    const resolved = await TypedDataEncoder.resolveNames(
      domain,
      types,
      value,
      async (n) => await resolveAddress(n, this.provider),
    );
    const transport = await this._transport;
    const eth = new Eth.default(transport);
    const payload = TypedDataEncoder.getPayload(
      resolved.domain,
      types,
      resolved.value,
    );
    let sig: SignatureLike;
    try {
      ///
      /// try signing EIP-712 message
      ///
      sig = await eth.signEIP712Message(this._path, payload);
      // deno-lint-ignore no-explicit-any
    } catch (e: any) {
      if (!e || e.statusCode !== 27904) {
        throw e;
      }
      ///
      /// older device: fallback onto signing raw hashes
      ///
      const domain_hash = TypedDataEncoder.hashDomain(domain);
      const value_hash = TypedDataEncoder.from(types).hash(value);
      sig = await eth.signEIP712HashedMessage(
        this._path,
        domain_hash.substring(2),
        value_hash.substring(2),
      );
    }
    ///
    /// normalize signature for ethers
    ///
    sig.r = `0x${sig.r}`;
    sig.s = `0x${sig.s}`;
    ///
    /// serialize signature
    ///
    return Signature.from(sig).serialized;
  }

  /**
   * Returns the HD %%path%%. If unspecified, returns the default
   * path (i.e. `m/44'/60'/0'/0/0`); if a `number`, the path is
   * for that account using the BIP-44 standard; else %%path%%
   * is returned directly.
   */
  static getPath(path?: string | number): string {
    if (!path) {
      path = 0;
    }
    if (typeof path === "number") {
      return getAccountPath(path);
    }
    return path;
  }
}
