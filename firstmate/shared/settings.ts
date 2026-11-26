/**
 * How the board is drawn, for this daemon's clients: a host settings document
 * the app reads and writes on its own. None of it means anything to the
 * daemon, which is why it is not in `config.json` — see "Which side owns a
 * persisted value" in the root AGENTS.md.
 */
import { defineSettings } from "@getpaseo/plugin";
import { z } from "zod";

export const POLL_SECONDS = [3, 5, 10, 30] as const;

/** What the chat can hide, in the order the settings screen lists them: each source of an injected message, then tool calls. */
export const CHAT_KINDS = ["cross-daemon", "agent", "notice", "watch", "tool"] as const;

export const displaySettings = defineSettings({
  id: "display",
  scope: "host",
  version: 1,
  schema: z.object({
    pollSeconds: z.number().int().min(1).max(120).default(5),
    /** Kinds of row the chat leaves out, from `CHAT_KINDS`. Cross-daemon messages are machine chatter, so hidden until asked for. */
    hiddenChatKinds: z.array(z.string()).default(["cross-daemon"]),
    /** When the newest first-mate message the captain has had open was said, by topic id: what an unread dot is judged against. */
    topicsRead: z.record(z.string(), z.string()).default({}),
  }),
});
