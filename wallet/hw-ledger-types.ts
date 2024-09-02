import type Eth from "@ledgerhq/hw-app-eth";

/**
 * Resolved transport instance — derived from what Eth's constructor accepts
 */
export type LedgerTransport = ConstructorParameters<typeof Eth.default>[0];

/**
 * Constructor input: transport class, module wrapper, promise or instance
 */
export type LedgerTransportArg =
  // transport class with create() method
  | { create(): Promise<LedgerTransport> }
  // module wrapper with default export
  | { default: LedgerTransportArg }
  // promise to a created transport
  | Promise<LedgerTransport>
  // transport instance
  | LedgerTransport;
