import { describe, expect, it } from "vitest";

import { fileTopicMessages, splitTopicTag, topicTag, type FilingItem } from "./topics";

describe("topic tags", () => {
  it("writes and reads a tag only at the very start", () => {
    expect(topicTag("fix-flaky-login")).toBe("[topic: fix-flaky-login]");
    expect(splitTopicTag("[topic: fix-flaky-login] any news?")).toEqual({ topicId: "fix-flaky-login", text: "any news?" });
    expect(splitTopicTag("  [Topic:fix-flaky-login]\nany news?")).toEqual({ topicId: "fix-flaky-login", text: "any news?" });
    expect(splitTopicTag("see [topic: fix-flaky-login]")).toBeNull();
    expect(splitTopicTag("[topic: has space] x")).toBeNull();
    expect(splitTopicTag("[topic: ] x")).toBeNull();
  });
});

describe("fileTopicMessages", () => {
  let seq = 0;
  function item(type: string, text: string, clientMessageId?: string): FilingItem {
    seq += 1;
    return {
      type,
      text,
      seqStart: seq,
      timestamp: `2026-09-22T10:00:${String(seq).padStart(2, "0")}.000Z`,
      ...(clientMessageId === undefined ? {} : { clientMessageId }),
    };
  }
  const summary = (items: FilingItem[]) =>
    fileTopicMessages(items).map(({ topicId, message }) => [topicId, message.from, message.seq, message.text]);

  it("files a tagged captain message and a reply that starts with its own tag, nothing else", () => {
    seq = 0;
    expect(
      summary([
        item("user_message", "[topic: fix-flaky-login] any news?"),
        item("assistant_message", "[topic: fix-flaky-login] Aye, "),
        item("assistant_message", "looking."),
        item("tool_call", ""),
        item("assistant_message", "Tests pass, untagged."),
        item("user_message", "[cross-daemon 3f2a9c1e] Harbour asks"),
        item("assistant_message", "Answering Harbour."),
        item("user_message", "what is for lunch?"),
        item("user_message", "[topic: add-dark-mode] and now?"),
        item("assistant_message", "[topic: add-dark-mode] "),
        item("assistant_message", "Dark."),
        item("assistant_message", ""),
      ]),
    ).toEqual([
      ["fix-flaky-login", "captain", 1, "any news?"],
      ["fix-flaky-login", "mate", 2, "Aye, looking."],
      ["add-dark-mode", "captain", 9, "and now?"],
      ["add-dark-mode", "mate", 10, "Dark."],
    ]);
  });

  it("does not file a captain's pasted watch block as injected, only a watch message with the plugin's id", () => {
    seq = 0;
    const block = '<firstmate-watch name="pr-watch" ran="2026-09-25T10:05:00Z">\nA\n</firstmate-watch>';
    expect(
      summary([
        item("user_message", "[topic: fix-flaky-login] hi"),
        item("user_message", block, "firstmate-watch-1"),
        item("assistant_message", "Seen."),
      ]),
    ).toEqual([["fix-flaky-login", "captain", 1, "hi"]]);
  });
});
