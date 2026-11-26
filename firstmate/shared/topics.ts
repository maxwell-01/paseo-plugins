/**
 * A backlog item as a topic: the tag that files a message under it, and the rule that reads the first
 * mate's conversation back into messages per topic. Pure and shared, so the daemon's log and the chat
 * agree on which message belongs where.
 */
import { z } from "zod";

import { classifyUserMessage } from "./chat-messages";

export const TopicMessageSchema = z.object({
  /** Where the message starts in the first mate's timeline; a streaming reply keeps its seq as it grows. */
  seq: z.number(),
  /** "agent" is the closing words of a card's own agent, read from its timeline; the topic log never stores it. */
  from: z.enum(["captain", "mate", "agent"]),
  /** The words, without the topic tag. */
  text: z.string(),
  /** When the timeline recorded it. */
  at: z.string(),
});
export type TopicMessage = z.infer<typeof TopicMessageSchema>;

/** The tag a message starts with to be filed under backlog item `id`. */
export function topicTag(id: string): string {
  return `[topic: ${id}]`;
}

const TAG = /^\s*\[topic:[ \t]?([\w.-]{1,64})\]\s*/i;

/** A message that starts with a topic tag, as its topic and the text after the tag; null for any other. */
export function splitTopicTag(text: string): { topicId: string; text: string } | null {
  const match = TAG.exec(text);
  if (match === null || match[1] === undefined) return null;
  return { topicId: match[1], text: text.slice(match[0].length) };
}

/** One timeline entry, reduced to what filing needs. */
export interface FilingItem {
  type: string;
  text?: string;
  clientMessageId?: string;
  seqStart: number;
  timestamp: string;
}

/**
 * The messages of a conversation that belong to a topic: a captain message that Paseo or another agent did
 * not inject and that starts with a tag, and a first-mate reply that itself starts with one. Consecutive
 * assistant messages are joined first, since a streamed reply arrives in pieces. Nothing is filed by
 * inheritance from an earlier message: Paseo never records its own notes in the timeline, so an untagged
 * reply may be to one the timeline does not show.
 */
export function fileTopicMessages(items: readonly FilingItem[]): { topicId: string; message: TopicMessage }[] {
  const filed: { topicId: string; message: TopicMessage }[] = [];
  let reply: { text: string; seq: number; at: string } | null = null;

  function endReply(): void {
    if (reply === null) return;
    const tagged = splitTopicTag(reply.text);
    if (tagged !== null && tagged.text.trim() !== "") {
      filed.push({ topicId: tagged.topicId, message: { seq: reply.seq, from: "mate", text: tagged.text, at: reply.at } });
    }
    reply = null;
  }

  for (const item of items) {
    if (item.type === "assistant_message") {
      if (reply === null) reply = { text: item.text ?? "", seq: item.seqStart, at: item.timestamp };
      else reply.text += item.text ?? "";
      continue;
    }
    endReply();
    if (item.type !== "user_message") continue;
    const text = item.text ?? "";
    const tagged = classifyUserMessage(text, item.clientMessageId) === null ? splitTopicTag(text) : null;
    if (tagged !== null) {
      filed.push({ topicId: tagged.topicId, message: { seq: item.seqStart, from: "captain", text: tagged.text, at: item.timestamp } });
    }
  }
  endReply();
  return filed;
}
