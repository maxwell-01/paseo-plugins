/**
 * The Topics screen: what the captain and the first mate are talking about, one topic per backlog item.
 * Three views share it: the board (`./topics-board`), one topic opened from it (`./topic-detail`), and
 * the general chat, which is the first mate's conversation without the messages filed under a topic.
 *
 * It reads the same fleet query as the FirstMate screen, so the two poll once between them. Like that
 * screen it is unmounted whenever the captain opens a workspace, so the view and the open topic live in
 * module scope.
 */
import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { useSettings } from "@getpaseo/plugin/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";

import type { CardAction, FleetCard } from "../shared/fleet";
import { displaySettings } from "../shared/settings";
import { captainMessage } from "./attachments";
import type { MateAsk } from "./card-answer";
import { MateChat } from "./chat";
import { FLEET_QUERY_KEY, useFleet } from "./fleet";
import { findOpenCard, openId, readPatch } from "./format";
import { useMateSender } from "./mate-send";
import { mateReplyText } from "./reply-target";
import { TopicDetail } from "./topic-detail";
import { readKey } from "./topic-format";
import { TopicsBoard } from "./topics-board";
import { FONT_SIZE } from "./type-scale";
import { Banner, IconButton, Segmented, errorText } from "./ui";

type TopicsView = "board" | "general";
let cachedView: TopicsView = "board";
/** The open topic, by `openId`, and its task id then: `findOpenCard` needs both once a line gains an agent. */
let cachedOpen: { id: string; taskId: string | null } | null = null;

const VIEWS: ReadonlyArray<{ value: TopicsView; label: string }> = [
  { value: "board", label: "Board" },
  { value: "general", label: "General chat" },
];

export function TopicsScreen({ theme, layout, navigation, host }: PluginScreenProps) {
  const compact = layout.compact;
  const queryClient = useQueryClient();
  const display = useSettings(displaySettings);
  const values = display.status === "ready" ? display.values : displaySettings.schema.parse({});
  const fleet = useFleet(values.pollSeconds);
  const data = fleet.data ?? null;
  const mate = data?.mate ?? null;
  const mateSender = useMateSender(mate?.id ?? "");

  const [view, setViewState] = useState(cachedView);
  const [open, setOpenState] = useState(cachedOpen);
  const [showInfo, setShowInfo] = useState(false);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY });
  }, [queryClient]);

  function setOpen(card: FleetCard | null): void {
    const id = card === null ? null : openId(card);
    cachedOpen = id === null ? null : { id, taskId: card?.taskId ?? null };
    setOpenState(cachedOpen);
    setShowInfo(false);
  }

  function setView(next: TopicsView): void {
    cachedView = next;
    setViewState(next);
    setOpen(null);
  }

  const cards = data?.cards ?? [];
  const openCard = open === null ? null : findOpenCard(cards, open.id, open.taskId);
  // A topic that has left the board closes, rather than leaving an empty view behind.
  useEffect(() => {
    if (data !== null && open !== null && openCard === null) setOpen(null);
  }, [data, open, openCard]);

  /**
   * Opening a topic reads it, and so does each newer message that arrives while it stays open. Each mark
   * is sent once: the settings document is new on every render, and a save is in flight for some of them.
   */
  const openKey = openCard === null ? null : readKey(openCard);
  const openLastAt = openCard?.lastMessage?.at;
  const markSent = useRef("");
  useEffect(() => {
    if (display.status !== "ready" || openKey === null || openLastAt === undefined) return;
    const mark = `${openKey}:${openLastAt}`;
    const next = readPatch(display.values.topicsRead, openKey, openLastAt);
    if (next === null || markSent.current === mark) return;
    markSent.current = mark;
    // Refused as stale, or failed: a later render sends the mark again, from the newer document.
    const retry = () => {
      markSent.current = "";
    };
    void display.save({ ...display.values, topicsRead: next }, display.revision).then((saved) => (saved ? undefined : retry()), retry);
  }, [display, openKey, openLastAt]);

  /** Every topic on the board has a thread here, so the general chat leaves all of their messages to them. */
  const threads = useMemo(
    () => new Set((data?.cards ?? []).flatMap((card) => (card.backlog === null ? [] : [card.backlog.id]))),
    [data],
  );

  const toMate: MateAsk | null =
    mate === null
      ? null
      : {
          sending: mateSender.sending,
          send: (text, onFailure, onSent) => mateSender.send(captainMessage(text, []), onFailure, onSent),
        };

  /** An answer button's prompt goes to the first mate under the topic's tag, so the exchange is filed with it. */
  function answer(card: FleetCard, action: CardAction): void {
    const topicId = card.backlog?.id;
    toMate?.send(topicId === undefined ? action.prompt : mateReplyText(topicId, action.prompt), undefined, refresh);
  }

  const styles = useMemo(() => {
    const { colors } = theme;
    return {
      screen: { flex: 1, backgroundColor: colors.surface0 },
      header: {
        minHeight: 44,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 10,
        paddingHorizontal: compact ? 10 : 14,
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      title: { flexShrink: 1, color: colors.foreground, fontSize: FONT_SIZE.body, fontWeight: "600" as const },
      spacer: { flex: 1 },
      host: {
        color: colors.foregroundMuted,
        fontSize: FONT_SIZE.caption,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
      },
      banners: { paddingHorizontal: compact ? 10 : 14, paddingTop: 8, gap: 6 },
      body: { flex: 1, minHeight: 0 },
      note: { color: colors.foregroundMuted, fontSize: FONT_SIZE.body, padding: 20 },
    };
  }, [theme, compact]);

  const problems = [
    ...(fleet.error === null ? [] : [{ tone: "danger" as const, text: errorText(fleet.error) }]),
    ...(data?.warnings ?? []).map((text) => ({ tone: "warning" as const, text })),
  ];
  const title = openCard !== null ? openCard.title : view === "general" ? "General chat" : "Topics";
  const openAgentId = openCard?.agent?.id;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {openCard === null ? null : (
          <IconButton icon="ArrowLeft" label="Board" showLabel theme={theme} onPress={() => setOpen(null)} />
        )}
        {/* On a phone the host's own bar already says Topics; only an open topic needs its name here. */}
        {compact && openCard === null ? null : (
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        )}
        {compact && openCard !== null ? null : (
          <Segmented theme={theme} quiet value={openCard === null ? view : null} options={VIEWS} onChange={setView} />
        )}
        <View style={styles.spacer} />
        {compact && openCard !== null ? (
          <IconButton
            icon={showInfo ? "MessageSquare" : "Info"}
            label={showInfo ? "Messages" : "Details"}
            showLabel
            theme={theme}
            onPress={() => setShowInfo(!showInfo)}
          />
        ) : (
          <Text style={styles.host} numberOfLines={1}>
            {compact ? host.label : `Host: ${host.label}`}
          </Text>
        )}
      </View>
      {problems.length === 0 ? null : (
        <View style={styles.banners}>
          {problems.map((problem) => (
            <Banner key={problem.text} theme={theme} tone={problem.tone} text={problem.text} />
          ))}
        </View>
      )}
      <View style={styles.body}>
        {data === null ? (
          <Text style={styles.note}>{fleet.error === null ? "Loading the topics…" : ""}</Text>
        ) : openCard !== null ? (
          <TopicDetail
            key={open?.id}
            card={openCard}
            theme={theme}
            compact={compact}
            showInfo={showInfo}
            pollSeconds={values.pollSeconds}
            toMate={toMate}
            onAnswer={(action) => answer(openCard, action)}
            onOpenAgent={
              openAgentId === undefined || navigation === undefined
                ? null
                : () => navigation.openAgent({ agentId: openAgentId })
            }
            onChanged={refresh}
          />
        ) : view === "board" ? (
          <TopicsBoard
            cards={cards}
            theme={theme}
            compact={compact}
            topicsRead={values.topicsRead}
            sending={toMate?.sending ?? true}
            onOpen={setOpen}
            onAnswer={answer}
          />
        ) : mate === null ? (
          <Text style={styles.note}>There is no first mate to talk to yet. Launch one on the FirstMate screen.</Text>
        ) : (
          <MateChat
            key={mate.id}
            mate={mate}
            theme={theme}
            compact={compact}
            hiddenKinds={values.hiddenChatKinds}
            threads={threads}
            onChanged={refresh}
            onOpenFile={null}
            asThread
          />
        )}
      </View>
    </View>
  );
}
