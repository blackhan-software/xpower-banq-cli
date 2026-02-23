import type { BanqArgs } from "./banq.ts";

export default function help(
  args: BanqArgs,
) {
  if (args.rest.length > 0) {
    if (args.rest[0] === "supply" || args.rest[0] === "su") {
      return cmd_amount_token(args, "supply", "Supply tokens into pool. 💸");
    }
    if (args.rest[0] === "borrow" || args.rest[0] === "bo") {
      return cmd_amount_token(args, "borrow", "Borrow tokens from pool. 💳");
    }
    if (args.rest[0] === "settle" || args.rest[0] === "se") {
      return cmd_amount_token(args, "settle", "Settle tokens into pool. 🤑");
    }
    if (args.rest[0] === "redeem" || args.rest[0] === "re") {
      return cmd_amount_token(args, "redeem", "Redeem tokens from pool. 💰");
    }
    if (args.rest[0] === "reindex" || args.rest[0] === "ri") {
      return cmd_token_ri(args, "reindex", "Re-index token positions. 🎡");
    }
    if (args.rest[0] === "rates-of" || args.rest[0] === "ro") {
      return cmd_token_ro(args, "rates-of", "Interest rates of tokens. 📈");
    }
    if (args.rest[0] === "health-of" || args.rest[0] === "ho") {
      return cmd_address_ho(args, "health-of", "Health of user positions. 🏥");
    }
    if (args.rest[0] === "liquidate" || args.rest[0] === "li") {
      return cmd_address_li(args, "liquidate", "Liquidate victim's funds. 💦");
    }
    if (args.rest[0] === "refresh" || args.rest[0] === "rf") {
      return cmd_token_token(args, "refresh", "Refresh pair's price feed. 💱");
    }
    if (args.rest[0] === "retwap" || args.rest[0] === "rt") {
      return cmd_token_token(args, "retwap", "Re-TWAP pair's price feed. 🔃");
    }
    if (args.rest[0] === "xpow-init" || args.rest[0] === "xi") {
      return cmd_xpow_init();
    }
    if (args.rest[0] === "xpow-mine" || args.rest[0] === "xm") {
      return cmd_xpow_mine();
    }
    if (args.rest[0] === "xpow-mint" || args.rest[0] === "xt") {
      return cmd_xpow_mint();
    }
    if (args.rest[0] === "apow-claim" || args.rest[0] === "ac") {
      return cmd_apow_claim();
    }
    if (args.rest[0] === "apow-claim-batch" || args.rest[0] === "acb") {
      return cmd_apow_claim_batch();
    }
    if (args.rest[0] === "acma") {
      return cmd_acma(args);
    }
  }
  cmd("Lend and borrow XPOW & APOW on 🔺valanche.");
}
function cmd(
  slug: string,
) {
  console.log(`XPower Banq: ${slug}`);
  usage_title();
  console.log(
    "  banq <command> <argument(s)> [--options]",
  );
  pool_commands();
  pool_options();
  oracle_commands();
  oracle_options();
  xpow_commands();
  apow_commands();
  acma_commands();
  wallet_options();
  gas_options();
  general_options();
  other_options();
  option_defaults();
  pool_examples();
  pool_examples_ri();
  oracle_examples();
  token_examples();
  xpow_examples();
  apow_examples();
  acma_examples();
}
function cmd_amount_token(
  args: BanqArgs,
  command: string,
  slug: string,
) {
  console.log(`XPower Banq: ${slug}`);
  usage_title();
  console.log(
    `  banq ${command} $AMOUNT $TOKEN [--options]`,
  );
  pool_options();
  if (command === "supply" || command === "borrow") {
    pow_options();
  }
  wallet_options();
  gas_options();
  general_options();
  other_options();
  option_defaults();
  pool_examples(args);
}
function cmd_address_head(
  command: string,
  slug: string,
) {
  console.log(`XPower Banq: ${slug}`);
  usage_title();
  console.log(
    `  banq ${command} $ADDRESS [--options]`,
  );
}
function cmd_address_ho(
  args: BanqArgs,
  command: string,
  slug: string,
) {
  cmd_address_head(command, slug);
  pool_options();
  wallet_options();
  gas_options();
  general_options();
  display_options();
  other_options();
  option_defaults();
  pool_examples(args);
}
function cmd_address_li(
  args: BanqArgs,
  command: string,
  slug: string,
) {
  console.log(`XPower Banq: ${slug}`);
  usage_title();
  console.log(
    `  banq ${command} $ADDRESS [$PARTIAL_EXP] [--options]`,
  );
  pool_options();
  wallet_options();
  gas_options();
  general_options();
  other_options();
  option_defaults();
  pool_examples(args);
}
function cmd_token_token(
  args: BanqArgs,
  command: string,
  slug: string,
) {
  console.log(`XPower Banq: ${slug}`);
  usage_title();
  console.log(
    `  banq ${command} $LHS_TOKEN $RHS_TOKEN [--options]`,
  );
  oracle_options();
  if (command === "retwap") {
    retwap_options();
  }
  wallet_options();
  general_options();
  other_options();
  option_defaults();
  oracle_examples(args);
}
function cmd_token_ri(
  args: BanqArgs,
  command: string,
  slug: string,
) {
  cmd_token_head_ri(command, slug);
  pool_options();
  reindex_options();
  wallet_options();
  general_options();
  other_options();
  option_defaults();
  pool_examples_ri(args);
}
function cmd_token_head_ri(
  command: string,
  slug: string,
) {
  console.log(`XPower Banq: ${slug}`);
  usage_title();
  console.log(
    `  banq ${command} $TOKEN --mode=supply [--options]`,
  );
  console.log(
    `  banq ${command} $TOKEN --mode=borrow [--options]`,
  );
}
function cmd_token_ro(
  args: BanqArgs,
  command: string,
  slug: string,
) {
  cmd_token_head_ro(command, slug);
  pool_options();
  paging_options();
  plot_options();
  wallet_options();
  gas_options();
  general_options();
  display_options();
  other_options();
  option_defaults();
  token_examples(args);
}
function cmd_token_head_ro(
  command: string,
  slug: string,
) {
  console.log(`XPower Banq: ${slug}`);
  usage_title();
  console.log(
    `  banq ${command} $TOKEN [--options]`,
  );
}
///
/// USAGE title
///
function usage_title() {
  console.log(
    "\n%cUSAGE",
    "font-weight: bold",
  );
}
///
/// POOL COMMANDs & OPTIONs
///
function pool_commands() {
  console.log(
    "\n%cPOOL COMMANDs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "su|supply:\t\t💸 Supply tokens into pool",
      "bo|borrow:\t\t💳 Borrow tokens from pool",
      "se|settle:\t\t🤑 Settle tokens into pool",
      "re|redeem:\t\t💰 Redeem tokens from pool",
      "",
      "ri|reindex:\t\t🎡 Re-index token positions",
      "ro|rates-of:\t\t📈 Interest rates of tokens",
      "ho|health-of:\t\t🏥 Health of user positions",
      "li|liquidate:\t\t💦 Liquidate victim's funds",
    ].join("\n  "),
  );
}
function pool_options() {
  console.log(
    "\n%cPOOL OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "-p|--pool: [P000]\t🏊 Pool identifier, address",
    ].join("\n  "),
  );
}
///
/// ORACLE COMMANDs & OPTIONs
///
function oracle_commands() {
  console.log(
    "\n%cORACLE COMMANDs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "rf|refresh:\t\t💱 Refresh pair's price feed",
      "rt|retwap:\t\t🔃 Re-TWAP pair's price feed",
    ].join("\n  "),
  );
}
function oracle_options() {
  console.log(
    "\n%cORACLE OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "-o|--oracle: [T000]\t💹 Oracle name, address",
    ].join("\n  "),
  );
}
///
/// WALLET OPTIONs
///
function wallet_options() {
  console.log(
    "\n%cWALLET OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "-k|--private-key $PRIVATE_KEY:",
      "\t\t\t🔑 Use account of private key",
      "-H|--hd-path $HD_PATH: [default]",
      "\t\t\t👣 Ledger wallet's HD path",
      "-l|--ledger:\t\t🔐 Use Ledger wallet",
    ].join("\n  "),
  );
}
///
/// GAS OPTIONs
///
function gas_options() {
  console.log(
    "\n%cGAS OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "-G|--gas-limit $GAS_LIMIT: [auto]",
      "\t\t\t🛑 Gas limit [wei]",
      "-f|--max-fee-per-gas $FEE: [auto]",
      "\t\t\t⛽ Maximum fee [wei]",
      "-F|--max-priority-fee-per-gas $FEE: [auto]",
      "\t\t\t💨 Maximum priority fee [wei]",
    ].join("\n  "),
  );
}
///
/// PAGING OPTIONs
///
function paging_options() {
  console.log(
    "\n%cPAGING OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "-@|--at:\t\t📍 Show rates at index",
      "-m|--model:\t\t💋 Show interest model",
      "-#|--page:\t\t📄 Show page of rate(s)",
      "-Z|--hist-size: [.5m]\t📜 Use history of size",
      "-z|--page-size: [10]\t📏 Use pages with size",
      "-s|--page-step: [1]\t🥾 Use pages with step",
    ].join("\n  "),
  );
}
///
/// PLOT OPTIONs
///
function plot_options() {
  console.log(
    "\n%cPLOT OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "-g|--plot: [usbt]\t📈 Show plot of rates",
    ].join("\n  "),
  );
}
///
/// GENERAL OPTIONs
///
function general_options() {
  console.log(
    "\n%cGENERAL OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "-u|--provider-url $PROVIDER_URL: [default]",
      "\t\t\t🌐 RPC provider endpoint",
      "-V|--contract-run $CONTRACT_RUN: [default=none]",
      "\t\t\t📦 Run version (v10a, v10b)",
      "-Y|--broadcast:\t📡 Broadcast transaction",
      "-P|--no-progress:\t🔇 Omit progress spinner",
      "-j|--json:\t\t🐉 Show JSON result only",
    ].join("\n  "),
  );
}
///
/// DISPLAY OPTIONs
///
function display_options() {
  console.log(
    "\n%cDISPLAY OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "-d|--digits: [2]\t🔟 Use fractional digits",
    ].join("\n  "),
  );
}
///
/// OTHER OPTIONs
///
function other_options() {
  console.log(
    "\n%cOTHER OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "-h|--help:\t\t🆘 Show help information",
      "-v|--version:\t\t📅 Show released version",
    ].join("\n  "),
  );
}
///
/// OPTION DEFAULTs
///
function option_defaults() {
  console.log(
    "\n%cOPTION DEFAULTs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "PROVIDER_URL\t\t🌐 https://api.avax.network/ext/bc/C/rpc",
      "CONTRACT_RUN\t\t📦 $CONTRACT_RUN from environment",
      "HD_PATH\t\t👣 m/44'/9000'/0'/0/0",
    ].join("\n  "),
  );
}
///
/// POOL EXAMPLEs
///
function pool_examples(
  args?: BanqArgs,
) {
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      !args //
        ? "export PRIVATE_KEY=0x...                 # 🔑"
        : "",
      !args || args.rest[0] === "su" || args.rest[0] === "supply"
        ? "banq supply 10.000 APOW -Y [--pool=P000] # 💸"
        : "",
      !args || args.rest[0] === "bo" || args.rest[0] === "borrow"
        ? "banq borrow 10.000 XPOW -Y [--pool=P000] # 💳"
        : "",
      !args || args.rest[0] === "se" || args.rest[0] === "settle"
        ? "banq settle 10.000 XPOW -Y [--pool=P000] # 🤑"
        : "",
      !args || args.rest[0] === "re" || args.rest[0] === "redeem"
        ? "banq redeem 10.000 APOW -Y [--pool=P000] # 💰"
        : "",
      !args || args.rest[0] === "ho" || args.rest[0] === "health-of"
        ? "banq health-of $ADDRESS -Y [--pool=P000] # 🏥"
        : "",
      !args || args.rest[0] === "li" || args.rest[0] === "liquidate"
        ? "banq liquidate $ADDRESS -Y [--pool=P000] # 💦"
        : "",
    ].filter((s) => s).join("\n  "),
  );
}
function pool_examples_ri(
  args?: BanqArgs,
) {
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      !args //
        ? "export CONTRACT_RUN=v10b                 # 📦"
        : "",
      !args || args.rest[0] === "ri" || args.rest[0] === "reindex"
        ? "banq ri APOW -M supply  -Y [--pool=P000] # 🎡"
        : "",
      !args || args.rest[0] === "ri" || args.rest[0] === "reindex"
        ? "banq ri XPOW -M borrow  -Y [--pool=P000] # 🎡"
        : "",
      !args || args.rest[0] === "ri" || args.rest[0] === "reindex"
        ? "banq ri APOW -M supply  -w               # 👀 live"
        : "",
      !args || args.rest[0] === "ri" || args.rest[0] === "reindex"
        ? "banq ri APOW -M supply  -w=2048          # 👀 last 2048 blocks"
        : "",
      !args || args.rest[0] === "ri" || args.rest[0] === "reindex"
        ? "banq ri APOW -M supply  -w=2048@3        # 👀 chunk 3 back"
        : "",
      !args || args.rest[0] === "ri" || args.rest[0] === "reindex"
        ? "banq ri APOW -M supply  -w=2048@all      # 👀 all history"
        : "",
    ].filter((s) => s).join("\n  "),
  );
}
///
/// ORACLE EXAMPLEs
///
function oracle_examples(
  args?: BanqArgs,
) {
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      !args ? "export PROVIDER_URL=https://...          # 🌐" : "",
      !args || args.rest[0] === "rf" || args.rest[0] === "refresh"
        ? "banq rf XPOW APOW [--oracle=T000] -Y     # 💱"
        : "",
      !args || args.rest[0] === "rt" || args.rest[0] === "retwap"
        ? "banq rt XPOW APOW [1E6] [-L 3] [-R 100]  # 🔃"
        : "",
      !args || args.rest[0] === "rt" || args.rest[0] === "retwap"
        ? "banq rt XPOW APOW -w                     # 👀 live"
        : "",
      !args || args.rest[0] === "rt" || args.rest[0] === "retwap"
        ? "banq rt XPOW APOW -w=4096                # 👀 last 4096 blocks"
        : "",
      !args || args.rest[0] === "rt" || args.rest[0] === "retwap"
        ? "banq rt XPOW APOW -w=4096@2              # 👀 chunk 2 back"
        : "",
      !args || args.rest[0] === "rt" || args.rest[0] === "retwap"
        ? "banq rt XPOW APOW -w=4096@all            # 👀 all history"
        : "",
    ].filter((s) => s).join("\n  "),
  );
}
///
/// TOKEN EXAMPLEs
///
function token_examples(
  args?: BanqArgs,
) {
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      !args || args.rest[0] === "ro" || args.rest[0] === "rates-of"
        ? "banq rates-of XPOW -Y [--at=0,1,..,now]  # 📈"
        : "",
      !args || args.rest[0] === "ro" || args.rest[0] === "rates-of"
        ? "banq rates-of APOW -Y [--page=0,1,2,..]  # 📉"
        : "",
      !args || args.rest[0] === "ro" || args.rest[0] === "rates-of"
        ? "banq rates-of XPOW -Y [-@ all] [--plot]  # 📈"
        : "",
      !args || args.rest[0] === "ro" || args.rest[0] === "rates-of"
        ? "banq rates-of APOW -Y [-@ all] [-g log]  # 📉"
        : "",
    ].filter((s) => s).join("\n  "),
  );
}
///
/// POW OPTIONs
///
function pow_options() {
  console.log(
    "\n%cPOW OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "-T|--timeout $MS: [300000]",
      "\t\t\t⏱  Proof-of-work timeout [ms]",
    ].join("\n  "),
  );
}
///
/// REINDEX OPTIONs
///
function reindex_options() {
  console.log(
    "\n%cREINDEX OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "-M|--mode $MODE:\t🔄 Position mode (supply, borrow)",
      "-w|--watch [=$RANGE]:\t👀 Watch events (real-time or range)",
    ].join("\n  "),
  );
}
///
/// RETWAP OPTIONs
///
function retwap_options() {
  console.log(
    "\n%cRETWAP OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "-L|--percent-min:  [3]📉 Min relative delta [%]",
      "-R|--percent-max:[100]📈 Max relative delta [%]",
      "-w|--watch [=$RANGE]:\t👀 Watch events (real-time or range)",
    ].join("\n  "),
  );
}
///
/// XPOW COMMANDs, OPTIONs & EXAMPLEs
///
function xpow_commands() {
  console.log(
    "\n%cXPOW COMMANDs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "xi|xpow-init:\t\t⚡ Initialize XPOW contract",
      "xm|xpow-mine:\t\t⛏  Mine XPOW PoW nonces",
      "xt|xpow-mint:\t\t✨ Mint XPOW from nonces",
    ].join("\n  "),
  );
}
function xpow_options() {
  console.log(
    "\n%cXPOW OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "--pow-level $N: [8]\t⛏  Required leading zeros",
      "--nonce-length $N: [8]🔢 Nonce byte length",
      "--to $ADDRESS:\t📬 Recipient address [signer]",
    ].join("\n  "),
  );
}
function xpow_examples(
  args?: BanqArgs,
) {
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      !args || args.rest[0] === "xi" || args.rest[0] === "xpow-init"
        ? "banq xpow-init XPOW -Y                   # ⚡"
        : "",
      !args || args.rest[0] === "xm" || args.rest[0] === "xpow-mine"
        ? "banq xpow-mine XPOW -Yj [--pow-level=3]  # ⛏"
        : "",
      !args || args.rest[0] === "xm" || args.rest[0] === "xpow-mine"
        ? "banq xpow-mint XPOW -Yj                  # ✨"
        : "",
    ].filter((s) => s).join("\n  "),
  );
}
function cmd_xpow_init() {
  console.log("XPower Banq: Initialize XPOW contract. ⚡");
  usage_title();
  console.log(
    "  banq xpow-init [$XPOW] [--options]",
  );
  wallet_options();
  gas_options();
  general_options();
  other_options();
  option_defaults();
  xpow_examples();
}
function cmd_xpow_mine() {
  console.log("XPower Banq: Mine XPOW proof-of-work nonces. ⛏");
  usage_title();
  console.log(
    "  banq xpow-mine [$XPOW] [--options]",
  );
  xpow_options();
  wallet_options();
  general_options();
  other_options();
  option_defaults();
  xpow_examples();
}
function cmd_xpow_mint() {
  console.log("XPower Banq: Mint XPOW from mined nonces. ✨");
  usage_title();
  console.log(
    "  banq xpow-mint [$XPOW] [--options]",
  );
  console.log(
    "\n  Reads JSON lines from stdin (piped from xpow-mine -j).",
  );
  wallet_options();
  gas_options();
  general_options();
  other_options();
  option_defaults();
  xpow_examples();
}
///
/// APOW COMMANDs, OPTIONs & EXAMPLEs
///
function apow_commands() {
  console.log(
    "\n%cAPOW COMMANDs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "ac|apow-claim:\t🎁 Claim APOW for NFT",
      "acb|apow-claim-batch:\t📦 Batch-claim APOW for NFTs",
    ].join("\n  "),
  );
}
function apow_options() {
  console.log(
    "\n%cAPOW OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "--nft-id $ID:\t\t🆔 NFT year-quarter (e.g. 202500)",
      "--to $ADDRESS:\t📬 Recipient address [signer]",
      "-T|--timeout $MS: [300000]",
      "\t\t\t⏱  Proof-of-work timeout [ms]",
    ].join("\n  "),
  );
}
function apow_examples(
  args?: BanqArgs,
) {
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      !args || args.rest[0] === "ac" || args.rest[0] === "apow-claim"
        ? "banq apow-claim APOW --nft-id=202500 -Y  # 🎁"
        : "",
      !args || args.rest[0] === "acb" || args.rest[0] === "apow-claim-batch"
        ? "banq acb APOW --nft-id=202500,202503 -Y  # 📦"
        : "",
    ].filter((s) => s).join("\n  "),
  );
}
function cmd_apow_claim() {
  console.log("XPower Banq: Claim APOW for a single NFT. 🎁");
  usage_title();
  console.log(
    "  banq apow-claim [$APOW] [--options]",
  );
  apow_options();
  wallet_options();
  gas_options();
  general_options();
  other_options();
  option_defaults();
  apow_examples();
}
function cmd_apow_claim_batch() {
  console.log("XPower Banq: Batch-claim APOW for multiple NFTs. 📦");
  usage_title();
  console.log(
    "  banq apow-claim-batch [$APOW] [--options]",
  );
  apow_options();
  wallet_options();
  gas_options();
  general_options();
  other_options();
  option_defaults();
  apow_examples();
}
///
/// ACMA COMMANDs, OPTIONs & EXAMPLEs
///
const ACMA_SUBCMDS = new Set([
  "show",
  "roles",
  "members",
  "targets",
  "hierarchy",
  "delays",
  "logs",
]);
function cmd_acma(
  args: BanqArgs,
) {
  const sub = args.rest.length > 1 && ACMA_SUBCMDS.has(String(args.rest[1]))
    ? String(args.rest[1])
    : undefined;
  if (sub === "show") return cmd_acma_show();
  if (sub === "roles") return cmd_acma_roles();
  if (sub === "members") return cmd_acma_members();
  if (sub === "targets") return cmd_acma_targets();
  if (sub === "hierarchy") return cmd_acma_hierarchy();
  if (sub === "delays") return cmd_acma_delays();
  if (sub === "logs") return cmd_acma_logs();
  // no subcommand: top-level acma help listing all subcommands
  return cmd_acma_top();
}
function acma_commands() {
  console.log(
    "\n%cACMA COMMANDs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "acma [show]:\t\t🔑 Authorization matrix",
      "acma roles:\t\t📋 All roles with metadata",
      "acma members:\t\t👥 Role => holder table",
      "acma targets:\t\t🎯 Target => fn => role",
      "acma hierarchy:\t🌲 Admin/guard role tree",
      "acma delays:\t\t⏱  Grant & admin delays",
      "acma logs:\t\t📜 Chronological event log",
    ].join("\n  "),
  );
}
function acma_options() {
  console.log(
    "\n%cACMA OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "--acma $ADDR:\t\t📍 ACMA contract address [env]",
      "--from-block $N:\t🔢 First block to scan [auto]",
      "--max-blocks $N:\t📦 Max blocks per scan batch",
      "--no-cache:\t\t🚫 Ignore and discard cached logs",
      "-a|--addresses:\t📒 Append address legend",
    ].join("\n  "),
  );
}
function acma_options_no_addresses() {
  console.log(
    "\n%cACMA OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "--acma $ADDR:\t\t📍 ACMA contract address [env]",
      "--from-block $N:\t🔢 First block to scan [auto]",
      "--max-blocks $N:\t📦 Max blocks per scan batch",
      "--no-cache:\t\t🚫 Ignore and discard cached logs",
    ].join("\n  "),
  );
}
function acma_logs_options() {
  console.log(
    "\n%cLOGS OPTIONs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "-n N|--limit N:\t🔢 Max events to show (default: 50; 0 = all)",
      "-e TYPE|--event TYPE:",
      "\t\t\t🏷  Filter by kind (repeatable, comma-sep):",
      "\t\t\t    granted revoked labeled admin-changed",
      "\t\t\t    guardian-changed grant-delay function-role",
      "\t\t\t    target-delay target-closed",
      "\t\t\t    operation-scheduled operation-executed",
      "\t\t\t    operation-canceled",
      "-r ROLE|--role ROLE:",
      "\t\t\t🎭 Filter by role name/ID (partial, case-insensitive)",
      "-a ADDR|--addr ADDR:",
      "\t\t\t📍 Filter by account/target (address or .env label)",
      "--asc:\t\t\t⬆  Oldest first (default: newest first)",
      "--tx:\t\t\t🔗 Include transaction hash column",
      "--timestamps:\t\t🕐 Fetch block timestamps (extra RPC per block)",
    ].join("\n  "),
  );
}
function acma_option_defaults() {
  option_defaults();
}
function acma_examples() {
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "banq acma -Y                             # 🔑",
      "banq acma roles -Y                       # 📋",
      "banq acma logs -Y -n 20 -e granted       # 📜",
    ].join("\n  "),
  );
}
function cmd_acma_top() {
  console.log("XPower Banq: ACMA matrix. 🔐");
  usage_title();
  console.log(
    "  banq acma [show|roles|members|targets|hierarchy|delays|logs] [--options]",
  );
  acma_commands();
  acma_options();
  general_options();
  other_options();
  acma_option_defaults();
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "banq acma -Y                                   # 🔑 authorization matrix",
      "banq acma roles -Y                             # 📋 all 60 roles",
      "banq acma members -Y                           # 👥 members with exec-delays",
      "banq acma targets -Y                           # 🎯 function→role mappings",
      "banq acma logs -Y -n 20 -e granted,revoked     # 📜 last 20 grant/revoke",
      "banq acma -Y --json                            # 🐉 raw JSON output",
      "banq acma -Y --no-cache --from-block 79428989  # 🔢 re-scan from block",
    ].join("\n  "),
  );
}
function cmd_acma_show() {
  console.log("XPower Banq: Compact authorization matrix. 🔑");
  usage_title();
  console.log(
    "  banq acma [show] [--options]",
  );
  acma_options();
  general_options();
  other_options();
  acma_option_defaults();
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "banq acma show -Y                              # 👀 default matrix",
      "banq acma show -Y -a                           # 📒 with address legend",
      "banq acma show -Y --json                       # 🐉 raw JSON",
    ].join("\n  "),
  );
}
function cmd_acma_roles() {
  console.log("XPower Banq: All roles with metadata. 📋");
  usage_title();
  console.log(
    "  banq acma roles [--options]",
  );
  acma_options_no_addresses();
  general_options();
  other_options();
  acma_option_defaults();
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "banq acma roles -Y                             # 📋 all 60 roles",
      "banq acma roles -Y --json                      # 🐉 raw JSON",
    ].join("\n  "),
  );
}
function cmd_acma_members() {
  console.log("XPower Banq: Role => holder address table. 👥");
  usage_title();
  console.log(
    "  banq acma members [--options]",
  );
  acma_options();
  general_options();
  other_options();
  acma_option_defaults();
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "banq acma members -Y                           # 👥 members with exec-delays",
      "banq acma members -Y -a                        # 📒 with address legend",
      "banq acma members -Y --json                    # 🐉 raw JSON",
    ].join("\n  "),
  );
}
function cmd_acma_targets() {
  console.log("XPower Banq: Target => function => role mappings. 🎯");
  usage_title();
  console.log(
    "  banq acma targets [--options]",
  );
  acma_options_no_addresses();
  general_options();
  other_options();
  acma_option_defaults();
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "banq acma targets -Y                           # 🎯 function→role mappings",
      "banq acma targets -Y --json                    # 🐉 raw JSON",
    ].join("\n  "),
  );
}
function cmd_acma_hierarchy() {
  console.log("XPower Banq: Role admin/guard tree. 🌲");
  usage_title();
  console.log(
    "  banq acma hierarchy [--options]",
  );
  acma_options_no_addresses();
  general_options();
  other_options();
  acma_option_defaults();
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "banq acma hierarchy -Y                         # 🌲 admin/guard tree",
      "banq acma hierarchy -Y --json                  # 🐉 raw JSON",
    ].join("\n  "),
  );
}
function cmd_acma_delays() {
  console.log("XPower Banq: Grant & target admin delays. ⏱");
  usage_title();
  console.log(
    "  banq acma delays [--options]",
  );
  acma_options();
  general_options();
  other_options();
  acma_option_defaults();
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "banq acma delays -Y                            # ⏱  grant & admin delays",
      "banq acma delays -Y --json                     # 🐉 raw JSON",
    ].join("\n  "),
  );
}
function cmd_acma_logs() {
  console.log("XPower Banq: Chronological event log. 📜");
  usage_title();
  console.log(
    "  banq acma logs [--options]",
  );
  acma_options_no_addresses();
  acma_logs_options();
  general_options();
  other_options();
  acma_option_defaults();
  console.log(
    "\n%cEXAMPLEs",
    "font-weight: bold",
  );
  console.log(
    "  " + [
      "banq acma logs -Y                              # 📜 last 50 events",
      "banq acma logs -Y -n 20 -e granted,revoked     # 📜 last 20 grant/revoke",
      "banq acma logs -Y -r POOL_CAP -e granted       # 🎭 grants for POOL_CAP",
      "banq acma logs -Y -a BOSS                      # 📍 events involving BOSS",
      "banq acma logs -Y -a P000 -e function-role     # 🎯 fn-role events for P000",
      "banq acma logs -Y --asc --timestamps           # ⬆  oldest-first w/ timestamps",
      "banq acma logs -Y --tx -n 0                    # 🔗 all events with tx hashes",
    ].join("\n  "),
  );
}
