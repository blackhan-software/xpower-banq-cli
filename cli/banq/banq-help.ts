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
      return cmd_token_token(args, "refresh", "Refresh pair's price feed. 🔃");
    }
    if (args.rest[0] === "retwap" || args.rest[0] === "rt") {
      return cmd_token_token(args, "retwap", "Retwap pair's price feed. ⏳");
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
  wallet_options();
  general_options();
  other_options();
  option_defaults();
  pool_examples();
  oracle_examples();
  token_examples();
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
  wallet_options();
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
  wallet_options();
  general_options();
  other_options();
  option_defaults();
  oracle_examples(args);
}
function cmd_token_head(
  command: string,
  slug: string,
) {
  console.log(`XPower Banq: ${slug}`);
  usage_title();
  console.log(
    `  banq ${command} $TOKEN [--options]`,
  );
}
function cmd_token_ro(
  args: BanqArgs,
  command: string,
  slug: string,
) {
  cmd_token_head(command, slug);
  pool_options();
  paging_options();
  plot_options();
  wallet_options();
  general_options();
  display_options();
  other_options();
  option_defaults();
  token_examples(args);
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
      "-p|--pool: [1]\t🏊 Pool identifier or address",
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
      "rf|refresh:\t\t🔃 Refresh pair's price feed",
      "rt|retwap:\t\t⏳ Retwap pair's price feed",
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
      "-o|--oracle: [UNUS]\t💹 Oracle name or address",
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
      !args ? "export PRIVATE_KEY=0x...              # 🔑" : "",
      !args || args.rest[0] === "su" || args.rest[0] === "supply"
        ? "banq supply 10.000 APOW -Y [--pool=1] # 💸"
        : "",
      !args || args.rest[0] === "bo" || args.rest[0] === "borrow"
        ? "banq borrow 10.000 XPOW -Y [--pool=1] # 💳"
        : "",
      !args || args.rest[0] === "se" || args.rest[0] === "settle"
        ? "banq settle 10.000 XPOW -Y [--pool=1] # 🤑"
        : "",
      !args || args.rest[0] === "re" || args.rest[0] === "redeem"
        ? "banq redeem 10.000 APOW -Y [--pool=1] # 💰"
        : "",
      !args || args.rest[0] === "ho" || args.rest[0] === "health-of"
        ? "banq health-of $ADDRESS -Y [--pool=1] # 🏥"
        : "",
      !args || args.rest[0] === "li" || args.rest[0] === "liquidate"
        ? "banq liquidate $ADDRESS -Y [--pool=1] # 💦"
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
      !args ? "export PROVIDER_URL=https://...       # 🌐" : "",
      !args || args.rest[0] === "rf" || args.rest[0] === "refresh"
        ? "banq rf XPOW APOW [--oracle=UNUS] -Y  # 🔃"
        : "",
      !args || args.rest[0] === "rt" || args.rest[0] === "retwap"
        ? "banq rt XPOW APOW [1E6] [-L 3 -R 100] # ⏳"
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
        ? "banq rates-of XPOW -Y [--at=0,..,now] # 📈"
        : "",
      !args || args.rest[0] === "ro" || args.rest[0] === "rates-of"
        ? "banq rates-of APOW -Y [--page=0,1,..] # 📉"
        : "",
      !args || args.rest[0] === "ro" || args.rest[0] === "rates-of"
        ? "banq rates-of XPOW -Y [-@ all --plot] # 📈"
        : "",
      !args || args.rest[0] === "ro" || args.rest[0] === "rates-of"
        ? "banq rates-of APOW -Y [-@ all -g log] # 📉"
        : "",
    ].filter((s) => s).join("\n  "),
  );
}
