import type { PluginTheme } from "@getpaseo/plugin";

import {
  COLUMN_IDS,
  CREW_LABELS,
  type AgentSummary,
  type ColumnId,
  type FleetCard,
  type WatchResult,
  type WatchSummary,
} from "../shared/fleet";
import type { TopicMessage } from "../shared/topics";
import { isHeld } from "./card-answer";

/** The captain's four columns, in the one order they are drawn. */
export const CAPTAIN_COLUMN_IDS = ["needs-you", "working", "queued", "done"] as const;
export type CaptainColumnId = (typeof CAPTAIN_COLUMN_IDS)[number];

export const CAPTAIN_COLUMNS: Readonly<Record<CaptainColumnId, { title: string; icon: string }>> = {
  "needs-you": { title: "Needs you", icon: "BellRing" },
  working: { title: "Working", icon: "Hammer" },
  queued: { title: "Queued", icon: "Inbox" },
  done: { title: "Done", icon: "Check" },
};

/** Whether a line's outcome says the work is finished: `(failed …)` and `(abandoned …)` still want the captain. */
function landed(outcome: string | null): boolean {
  return outcome !== null && /^(merged|done|landed|closed)\b/.test(outcome);
}

/**
 * Where a card sits when the board is read as "what do I have to do": a
 * finished item is Done whatever its line still says; anything held, blocked or
 * failed waits on the captain; a crewmate at work or at rest is Working; the
 * rest has not started.
 */
export function captainColumn(card: FleetCard): CaptainColumnId {
  const item = card.backlog;
  if (item?.section === "done" || landed(item?.outcome ?? null) || card.column === "done") return "done";
  if (isHeld(card) || card.column === "blocked" || card.column === "failed") return "needs-you";
  if (card.column === "working" || card.column === "idle") return "working";
  return "queued";
}

/**
 * What the board remembers an open card by: its agent's id, or its task id when it has no agent. Never
 * `card.key`, whose backlog form holds the line's index, which moves when the first mate edits the file above
 * it. The agent comes first because two crewmates can share a task label, and a Done line can share its id
 * with a live crewmate's card.
 */
export function openId(card: FleetCard): string | null {
  return card.agent?.id ?? card.taskId;
}

/** The read map with `topicId` read up to the message said at `at`; null when it already was, so nothing is saved for it. */
export function readPatch(
  read: Readonly<Record<string, string>>,
  topicId: string,
  at: string,
): Record<string, string> | null {
  if (at <= (read[topicId] ?? "")) return null;
  return { ...read, [topicId]: at };
}

/**
 * The card an open view is about. Found by the id it was opened under; failing that by the task id it had
 * then, because a backlog line that gains an `(agent: …)` changes its card's `openId` from the task id to
 * the agent's. Null only when neither is on the board any more.
 */
export function findOpenCard(cards: readonly FleetCard[], id: string, taskId: string | null): FleetCard | null {
  return (
    cards.find((card) => openId(card) === id) ??
    (taskId === null ? null : cards.find((card) => card.taskId === taskId)) ??
    null
  );
}

/**
 * A card's last message as one line: who said it, then the words with their line breaks folded away.
 * `agentTitle` names the card's agent when it is the one that spoke.
 */
export function lastMessageLine(message: TopicMessage, agentTitle: string | null = null): string {
  const who = message.from === "mate" ? "First mate" : message.from === "agent" ? agentTitle ?? "Agent" : "You";
  return `${who}: ${message.text.replace(/\s+/g, " ").trim()}`;
}

/**
 * Whether a card opens the way it was left. One that has moved column since —
 * its crewmate finished, failed, started again — goes back to rest, because
 * the actions it was showing were for where it was; one with something in
 * progress in it (a steer half-typed, an End waiting to be confirmed) stays
 * open, so the move never costs the captain what they were doing.
 */
export function opensAsLeft(left: { column: ColumnId; inProgress: boolean }, column: ColumnId): boolean {
  return left.inProgress || left.column === column;
}

export function columnTone(theme: PluginTheme, column: ColumnId): string {
  switch (column) {
    case "working":
      return theme.colors.accent;
    case "blocked":
    case "parked":
      return theme.colors.statusWarning;
    case "done":
      return theme.colors.statusSuccess;
    case "failed":
      return theme.colors.statusDanger;
    default:
      return theme.colors.foregroundMuted;
  }
}

export function agentStatusLabel(agent: AgentSummary): string {
  if (agent.pendingPermissions > 0) {
    return agent.pendingPermissions === 1 ? "waiting on a permission" : `waiting on ${agent.pendingPermissions} permissions`;
  }
  switch (agent.status) {
    case "running":
      return "working";
    case "initializing":
      return "starting";
    case "error":
      return "errored";
    case "closed":
      return "closed";
    default:
      return "idle";
  }
}

export function agentStatusTone(theme: PluginTheme, agent: AgentSummary): string {
  if (agent.pendingPermissions > 0 || agent.requiresAttention) return theme.colors.statusWarning;
  if (agent.status === "error") return theme.colors.statusDanger;
  if (agent.status === "running" || agent.status === "initializing") return theme.colors.accent;
  return theme.colors.foregroundMuted;
}

/** A token count as Paseo's own context meter writes it: "840", "84k", "1m". */
export function formatTokenCount(value: number): string {
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}m`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return Math.round(value).toString();
}

/** How full a context window is, in percent, or null while the provider has not said. */
export function contextPercent(used: number | null | undefined, max: number | null | undefined): number | null {
  if (typeof used !== "number" || typeof max !== "number") return null;
  if (!Number.isFinite(used) || !Number.isFinite(max) || used < 0 || max <= 0) return null;
  return (used / max) * 100;
}

/** The meter's colour, at Paseo's own thresholds: past 90% it is danger, from 70% a warning. */
export function contextTone(theme: PluginTheme, percent: number): string {
  if (percent > 90) return theme.colors.statusDanger;
  if (percent >= 70) return theme.colors.statusWarning;
  return theme.colors.foregroundMuted;
}

const WATCH_RESULTS: Readonly<Record<WatchResult, string>> = {
  never: "not run yet",
  silent: "nothing new",
  queued: "waiting for the first mate",
  dropped: "dropped before the first mate could take it",
  delivered: "sent to the first mate",
  failed: "failed",
  invalid: "cannot run",
};

/** One line on how a watch stands: "every 5 min" is the schedule's, this is the rest — "off · ran 5m ago · nothing new". */
export function watchStatusText(watch: WatchSummary, now: number = Date.now()): string {
  const parts: string[] = [];
  if (!watch.enabled) parts.push("off");
  if (watch.running) parts.push("running now");
  if (watch.lastRunAt !== null && watch.lastResult !== "invalid") parts.push(`ran ${relativeTime(watch.lastRunAt, now)}`);
  parts.push(WATCH_RESULTS[watch.lastResult]);
  return parts.join(" · ");
}

export function watchTone(theme: PluginTheme, watch: WatchSummary): string {
  if (!watch.enabled) return theme.colors.foregroundMuted;
  switch (watch.lastResult) {
    case "failed":
    case "invalid":
      return theme.colors.statusDanger;
    case "queued":
    case "dropped":
      return theme.colors.statusWarning;
    case "delivered":
      return theme.colors.accent;
    default:
      return theme.colors.foregroundMuted;
  }
}

/** "just now", "5m ago", "3h ago", "2d ago". */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 36) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** The last `max` characters of a path, from a separator, so the end — the part that differs — survives. */
export function shortPath(path: string, max = 48): string {
  if (path.length <= max) return path;
  const tail = path.slice(-max);
  const cut = tail.indexOf("/");
  return `…${cut > 0 ? tail.slice(cut) : tail}`;
}

/** The provider and model, `claude/opus` style, or whichever of the two is known. */
export function modelLabel(agent: Pick<AgentSummary, "provider" | "model">): string {
  return agent.model === null ? agent.provider : `${agent.provider}/${agent.model}`;
}

/** Cards grouped by column, each column in the order the daemon sent them. */
export function groupCards(cards: readonly FleetCard[]): Map<ColumnId, FleetCard[]> {
  const groups = new Map<ColumnId, FleetCard[]>(COLUMN_IDS.map((id) => [id, []]));
  for (const card of cards) groups.get(card.column)?.push(card);
  return groups;
}

/** Cards grouped into the captain's four columns, each in the order the daemon sent them. */
export function groupCaptainCards(cards: readonly FleetCard[]): Map<CaptainColumnId, FleetCard[]> {
  const groups = new Map<CaptainColumnId, FleetCard[]>(CAPTAIN_COLUMN_IDS.map((id) => [id, []]));
  for (const card of cards) groups.get(captainColumn(card))?.push(card);
  return groups;
}

/**
 * The sentence a failure is worth showing. An RPC that fails in the daemon
 * reaches the app as "Request failed: <the handler's message>
 * requestType=plugin.rpc.invoke.request code=handler_error"; the wrapper is
 * for logs, and the captain gets the message the handler wrote.
 */
export function errorText(caught: unknown): string {
  const raw = caught instanceof Error ? caught.message : String(caught);
  const clean = raw
    .replace(/^Request failed:\s*/, "")
    .replace(/\s+requestType=\S+(\s+code=\S+)?\s*$/, "")
    .trim();
  return clean === "" ? raw : clean;
}

/**
 * Whether End and Relaunch are offered for this agent: only for one the first mate made as crew. A backlog
 * item's own agent has no crew label, and the daemon refuses both for it.
 */
export function canEndOrRelaunch(agent: Pick<AgentSummary, "labels">): boolean {
  return agent.labels[CREW_LABELS.role] === CREW_LABELS.crewRole;
}
