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
  from: z.enum(["captain", "mate"]),
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

/** A message's topic, and its words once the tag is taken off. */
export interface FiledText {
  topicId: string | null;
  text: string;
}

/**
 * The filing rule, one message at a time, for whoever walks the first mate's conversation in order. A
 * captain message with a tag sets the current topic; one without a tag, or a message something else
 * injected, clears it. A reply that starts with a tag is filed there and sets the current topic; any
 * other reply, and anything else in the conversation, takes the current topic.
 */
export function createTopicTracker(): {
  captain(text: string): FiledText;
  injected(): void;
  reply(text: string): FiledText;
  current(): string | null;
} {
  let current: string | null = null;
  return {
    captain(text) {
      const tagged = splitTopicTag(text);
      current = tagged?.topicId ?? null;
      return { topicId: current, text: tagged?.text ?? text };
    },
    injected() {
      current = null;
    },
    reply(text) {
      const tagged = splitTopicTag(text);
      if (tagged !== null) current = tagged.topicId;
      return { topicId: current, text: tagged?.text ?? text };
    },
    current: () => current,
  };
}

/**
 * The messages of a conversation that belong to a topic, by `createTopicTracker`'s rule. Consecutive
 * assistant messages are joined first, since a streamed reply arrives in pieces. A reply with no topic is
 * not filed.
 */
export function fileTopicMessages(items: readonly FilingItem[]): { topicId: string; message: TopicMessage }[] {
  const filed: { topicId: string; message: TopicMessage }[] = [];
  const tracker = createTopicTracker();
  let reply: { text: string; seq: number; at: string } | null = null;

  function endReply(): void {
    if (reply === null) return;
    const { topicId, text } = tracker.reply(reply.text);
    if (topicId !== null && text.trim() !== "") {
      filed.push({ topicId, message: { seq: reply.seq, from: "mate", text, at: reply.at } });
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
    if (classifyUserMessage(text, item.clientMessageId) !== null) {
      tracker.injected();
      continue;
    }
    const { topicId, text: words } = tracker.captain(text);
    if (topicId !== null) {
      filed.push({ topicId, message: { seq: item.seqStart, from: "captain", text: words, at: item.timestamp } });
    }
  }
  endReply();
  return filed;
}
