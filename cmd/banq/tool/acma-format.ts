import process from "node:process";
import { prefix_by } from "../../../env/find-by.ts";
import { abbressOf } from "../../../function/address.ts";

/**
 * Format a delay value as human-readable string.
 * 0 → "0", 86400 → "1d", 3600 → "1h", 90 → "1m30s", etc.
 */
export function format_delay(seconds: number): string {
  if (seconds === 0) {
    return "0";
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0) parts.push(`${s}s`);
  return parts.join("");
}

/**
 * Format a since-timestamp for display.
 * If since <= now: "now". Otherwise: ISO date.
 */
export function format_since(since: number): string {
  if (since === 0) {
    return "now";
  }
  const now = Math.floor(Date.now() / 1000);
  if (since <= now) {
    return "now";
  }
  const d = new Date(since * 1000);
  return d.toISOString().slice(0, 19);
}

/**
 * Get display label for an address (from .env or abbreviated hex).
 */
export function label_of(address: bigint): string {
  const name = prefix_by(address);
  if (name) {
    return name;
  }
  return abbressOf(address);
}

/**
 * Get short column-header label (first 4 chars) for an address.
 */
export function short_label(address: bigint): string {
  const name = prefix_by(address);
  if (name) {
    return name.slice(0, 4);
  }
  // use first 4 hex digits (no 0x prefix)
  const hex = address.toString(16).padStart(40, "0");
  return hex.slice(0, 4).toUpperCase();
}

/**
 * Legend label: `SHORT: ABBREV (ENV_NAME)` or `SHORT: ABBREV`.
 */
export function legend_label(address: bigint): string {
  const name = prefix_by(address);
  const abbr = abbressOf(address);
  const short = name ? name.slice(0, 4) : address.toString(16).padStart(40, "0")
    .slice(0, 4).toUpperCase();
  if (name) {
    return `${short}: ${abbr} (${name})`;
  }
  return `${short}: ${abbr}`;
}

/**
 * Get terminal width.
 */
export function term_cols(): number {
  return process.stdout.columns ?? 80;
}

/**
 * Build a framed box section.
 */
export function frame(sections: FrameSection[]): string {
  const cols = term_cols();
  const w = Math.max(cols, 40);
  const lines: string[] = [];
  lines.push(`╔${"═".repeat(w - 2)}╗`);
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (i > 0) {
      lines.push(`╟${"─".repeat(w - 2)}╢`);
    }
    if (s.title) {
      const lhs = `> ${s.title}`;
      const rhs = s.meta ?? "";
      const gap = Math.max(1, w - 4 - lhs.length - rhs.length);
      lines.push(`║ ${bold(lhs)}${" ".repeat(gap)}${rhs} ║`);
      lines.push(`╟${"─".repeat(w - 2)}╢`);
    }
    for (const line of s.rows) {
      const padded = pad_right(line, w - 4);
      lines.push(`║ ${padded} ║`);
    }
  }
  lines.push(`╚${"═".repeat(w - 2)}╝`);
  return lines.join("\n");
}

export type FrameSection = {
  title?: string;
  meta?: string;
  rows: string[];
};

/**
 * Pad string to given width with spaces on right.
 */
export function pad_right(s: string, width: number): string {
  const visible = strip_ansi(s).length;
  const pad = Math.max(0, width - visible);
  return s + " ".repeat(pad);
}

/**
 * Pad string to given width with spaces on left.
 */
export function pad_left(s: string, width: number): string {
  const visible = strip_ansi(s).length;
  const pad = Math.max(0, width - visible);
  return " ".repeat(pad) + s;
}

/**
 * Strip ANSI escape codes.
 */
function strip_ansi(s: string): string {
  // deno-lint-ignore no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Bold text with ANSI escape.
 */
function bold(s: string): string {
  return `\x1b[1m${s}\x1b[0m`;
}

/**
 * Build a separator row of ─ characters.
 */
export function separator(width: number): string {
  return "─".repeat(width);
}

/**
 * Build vertical column headers from labels.
 * Each label is written top-to-bottom, one char per row.
 * Returns array of header rows.
 */
export function vertical_headers(
  labels: string[],
  col_width: number,
): string[] {
  if (labels.length === 0) {
    return [];
  }
  const max_len = Math.max(...labels.map((l) => l.length));
  const rows: string[] = [];
  for (let row = 0; row < max_len; row++) {
    const line = labels.map((label) => {
      const ch = row < label.length ? label[row] : " ";
      return ch.padStart(Math.ceil(col_width / 2)).padEnd(col_width);
    }).join("");
    rows.push(line);
  }
  return rows;
}

/**
 * Format a number with comma separators.
 */
export function commas(n: number): string {
  return n.toLocaleString("en-US");
}
