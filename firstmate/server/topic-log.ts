/**
 * The first mate's conversation, filed by topic and kept on the daemon.
 *
 * The first mate's timeline is far too long to read whole, and the app reads only its tail, so a topic's
 * thread built there would lose its oldest messages within the hour. This reads the tail the way the chat
 * does, files what is tagged (`shared/topics.ts`), and keeps the newest of each topic in
 * `$PASEO_HOME/plugin-data/firstmate/topics.json`. A message already kept is replaced by its newer self,
 * never deleted by a re-read.
 */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";

import type { PluginLifecycleRegistration } from "@getpaseo/plugin/server";
import { z } from "zod";

import type { FirstmateConfig } from "../shared/fleet";
import { TopicMessageSchema, fileTopicMessages, type FilingItem, type TopicMessage } from "../shared/topics";
import { dataPath } from "./data-dir";
import { fetchLiveAgent } from "./fleet";
import type { PaseoApi, TimelineEntry } from "./host-types";
import { serialized } from "./serialize";

/** Messages kept per topic. */
export const MAX_TOPIC_MESSAGES = 200;
/** Timeline entries read back, projected as the chat reads them. */
const TAIL_ENTRIES = 300;

const TopicFileSchema = z.object({
  /** The first mate the stored messages were read from. */
  mateAgentId: z.string(),
  /** Added to a new first mate's seqs so they cannot overwrite the old one's: a seq counts from zero in every agent. */
  seqOffset: z.number(),
  topics: z.record(z.string(), z.array(TopicMessageSchema)),
});
type TopicFile = z.infer<typeof TopicFileSchema>;

const EMPTY: TopicFile = { mateAgentId: "", seqOffset: 0, topics: {} };

function topicsFile(): string {
  return dataPath("topics.json");
}

async function readTopicFile(): Promise<TopicFile> {
  let text: string;
  try {
    text = await readFile(topicsFile(), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return EMPTY;
    throw error;
  }
  return TopicFileSchema.parse(JSON.parse(text));
}

async function writeTopicFile(file: TopicFile): Promise<void> {
  const target = topicsFile();
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(file), { mode: 0o600 });
  await rename(temporary, target);
}

/** What filing needs of an entry: the words of a user or assistant message, and nothing of any other item. */
function filingItem(entry: TimelineEntry): FilingItem {
  const item = entry.item;
  const base = { type: item.type, seqStart: entry.seqStart, timestamp: entry.timestamp };
  if (item.type === "user_message") {
    return { ...base, text: item.text, ...(item.clientMessageId === undefined ? {} : { clientMessageId: item.clientMessageId }) };
  }
  if (item.type === "assistant_message") return { ...base, text: item.text };
  return base;
}

/** `kept` with `incoming` upserted by seq, oldest first, the newest `MAX_TOPIC_MESSAGES` of them. */
export function mergeTopicMessages(kept: readonly TopicMessage[], incoming: readonly TopicMessage[]): TopicMessage[] {
  const bySeq = new Map(kept.map((message) => [message.seq, message]));
  incoming.forEach((message) => bySeq.set(message.seq, message));
  return [...bySeq.values()].sort((a, b) => a.seq - b.seq).slice(-MAX_TOPIC_MESSAGES);
}

/** The next free seq above everything kept. */
function seqAbove(topics: TopicFile["topics"]): number {
  return Math.max(-1, ...Object.values(topics).flatMap((messages) => messages.map((message) => message.seq))) + 1;
}

export class TopicLog {
  private synced: { agentId: string; updatedAt: string } | null = null;

  /**
   * Files the first mate's conversation. Skipped while `updatedAt` is the one last filed, so the board's
   * poll costs nothing while the first mate is quiet.
   */
  sync(paseo: PaseoApi, mate: { id: string; updatedAt: string }): Promise<void> {
    return serialized(topicsFile(), async () => {
      if (this.synced?.agentId === mate.id && this.synced.updatedAt === mate.updatedAt) return;
      const page = await paseo.agents
        .ref(mate.id)
        .timeline.refetch({ direction: "tail", limit: TAIL_ENTRIES, projection: "projected" });
      const file = await readTopicFile();
      const changedMate = file.mateAgentId !== "" && file.mateAgentId !== mate.id;
      const seqOffset = changedMate ? seqAbove(file.topics) : file.seqOffset;
      const topics = { ...file.topics };
      const filed = fileTopicMessages(page.entries.map(filingItem));
      for (const { topicId, message } of filed) {
        topics[topicId] = mergeTopicMessages(topics[topicId] ?? [], [{ ...message, seq: message.seq + seqOffset }]);
      }
      await writeTopicFile({ mateAgentId: mate.id, seqOffset, topics });
      this.synced = { agentId: mate.id, updatedAt: mate.updatedAt };
    });
  }

  /** One topic's messages, oldest first. */
  async messages(topicId: string): Promise<TopicMessage[]> {
    return serialized(topicsFile(), async () => (await readTopicFile()).topics[topicId] ?? []);
  }

  /** The newest message of every topic. */
  async latest(): Promise<Map<string, TopicMessage>> {
    return serialized(topicsFile(), async () => {
      const newest = new Map<string, TopicMessage>();
      for (const [topicId, messages] of Object.entries((await readTopicFile()).topics)) {
        const last = messages[messages.length - 1];
        if (last !== undefined) newest.set(topicId, last);
      }
      return newest;
    });
  }
}

/**
 * Files the first mate's conversation when one of its turns ends, so a turn that finishes with no app
 * open is not left for the next board poll to find. A failure is logged and changes nothing else.
 */
export function registerTopicSync(
  server: PluginLifecycleRegistration,
  topics: TopicLog,
  readConfig: () => Promise<FirstmateConfig>,
): () => void {
  return server.addHook("agent.turn.after", async (event, { paseo }) => {
    try {
      const mateId = (await readConfig()).mateAgentId.trim();
      if (mateId === "" || mateId !== event.agent.id) return;
      const mate = await fetchLiveAgent(paseo, mateId);
      if (mate !== null) await topics.sync(paseo, mate);
    } catch (error) {
      console.error("[firstmate] could not file the first mate's topics:", error);
    }
  });
}
