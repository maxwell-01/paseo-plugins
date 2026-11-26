/**
 * The FirstMate screen: what the captain and the first mate are talking about, one topic per backlog item.
 * The board (`./topics-board`) is what it opens on; one topic opened from it (`./topic-detail`) and the
 * general chat, which is the first mate's conversation without the messages filed under a topic, take its
 * place. The header's menu (`./board-menu`) opens what is looked at now and then: the first mate's
 * suggestions, the home's watches and its files.
 *
 * A screen is unmounted whenever the captain opens a workspace, so the view and the open topic live in
 * module scope.
 */
import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { useRpc, useSettings } from "@getpaseo/plugin/client";
import { useToast } from "@getpaseo/plugin/client/react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { markMateSeen, removeSuggestion, type CardAction, type Fleet, type FleetCard, type Suggestion } from "../shared/fleet";
import { displaySettings } from "../shared/settings";
import { captainMessage } from "./attachments";
import { BoardMenuList, boundSettingsOpener, type BoardMenuEntry } from "./board-menu";
import type { MateAsk } from "./card-answer";
import { MateChat } from "./chat";
import { FilesView, type FilesRequest } from "./files";
import { FLEET_QUERY_KEY, useFleet } from "./fleet";
import { agentStatusLabel, agentStatusTone, findOpenCard, openId, readPatch } from "./format";
import { LaunchPanel } from "./launch";
import { MateBanners } from "./mate-banners";
import { useMateSender } from "./mate-send";
import { mateReplyText } from "./reply-target";
import { SUGGESTIONS_ICON, SUGGESTIONS_TITLE, SuggestionList } from "./suggestions";
import { TopicDetail } from "./topic-detail";
import { readKey } from "./topic-format";
import { TopicsBoard } from "./topics-board";
import { FONT_SIZE } from "./type-scale";
import { Chip, IconButton, Segmented, errorText } from "./ui";
import { WATCHES_ICON, WATCHES_TITLE, WatchList } from "./watches";

type TopicsView = "board" | "general";
/** What the menu opens in the board's place. */
type MenuView = "suggestions" | "watches" | "files";
type ScreenView = TopicsView | MenuView;
let cachedView: ScreenView = "board";
/** The open topic, by `openId`, and its task id then: `findOpenCard` needs both once a line gains an agent. */
let cachedOpen: { id: string; taskId: string | null } | null = null;

const VIEW_TITLES: Record<ScreenView, string> = {
  board: "Topics",
  general: "General chat",
  suggestions: SUGGESTIONS_TITLE,
  watches: WATCHES_TITLE,
  files: "Files",
};
const HEADER_HEIGHT = 44;

export function FirstMateScreen({ theme, layout, navigation, host }: PluginScreenProps) {
  const compact = layout.compact;
  const queryClient = useQueryClient();
  const toast = useToast();
  const removeSuggestions = useRpc(removeSuggestion);
  const display = useSettings(displaySettings);
  const values = display.status === "ready" ? display.values : displaySettings.schema.parse({});
  const fleet = useFleet(values.pollSeconds);
  const data = fleet.data ?? null;
  const mate = data?.mate ?? null;
  const mateSender = useMateSender(mate?.id ?? "");

  const [chosenView, setViewState] = useState(cachedView);
  /** Before there is a first mate the screen is the launch panel alone, whatever was last open. */
  const view: ScreenView = mate === null ? "board" : chosenView;
  const [open, setOpenState] = useState(cachedOpen);
  const [showInfo, setShowInfo] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(HEADER_HEIGHT);
  /** A file the Files view should open; not kept across a remount, or it would open again on return. */
  const [filesRequest, setFilesRequest] = useState<FilesRequest | null>(null);
  /** Where the header's back button leads from a menu view: the chat, when a file link there opened Files. */
  const [backTo, setBackTo] = useState<TopicsView>("board");

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY });
  }, [queryClient]);

  function setOpen(card: FleetCard | null): void {
    const id = card === null ? null : openId(card);
    cachedOpen = id === null ? null : { id, taskId: card?.taskId ?? null };
    setOpenState(cachedOpen);
    setShowInfo(false);
  }

  function setView(next: ScreenView): void {
    cachedView = next;
    setViewState(next);
    setBackTo("board");
    setOpen(null);
  }

  function openFile(path: string): void {
    const from = view;
    setView("files");
    if (from === "general") setBackTo("general");
    setFilesRequest({ path, at: Date.now() });
  }

  const cards = data?.cards ?? [];
  const openCard = open === null || mate === null ? null : findOpenCard(cards, open.id, open.taskId);
  /** The first mate's conversation is on screen. */
  const chatShown = view === "general" && openCard === null;
  // A topic that has left the board closes, rather than leaving an empty view behind.
  useEffect(() => {
    if (data !== null && mate !== null && open !== null && openCard === null) setOpen(null);
  }, [data, mate, open, openCard]);

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

  /**
   * While the first mate's chat is on screen the captain is looking at it, so its "finished" flag is
   * cleared the way opening it in Paseo would clear it, and its workspace reads as done in the sidebar.
   * Not while the board covers the chat: the flag is then what puts a dot on General chat. Keyed by
   * `updatedAt`, so a turn that ends while the chat is open is cleared too, and a clear that failed is
   * not retried until something changes. A pending permission is left flagged; the server checks that again.
   */
  const markSeen = useRpc(markMateSeen);
  const unseen =
    chatShown && mate !== null && mate.requiresAttention && mate.pendingPermissions === 0
      ? `${mate.id}:${mate.updatedAt}`
      : null;
  useEffect(() => {
    if (unseen === null) return;
    markSeen({})
      .then((result) => {
        if (result.cleared) refresh();
      })
      .catch((caught: unknown) => {
        console.warn("[firstmate] could not mark the first mate as seen:", caught);
      });
  }, [unseen, markSeen, refresh]);

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

  /** A suggestion is sent as the chat's Send would send it, and the chat comes into view to show it going out. */
  function suggest(prompt: string): void {
    if (toMate?.send(prompt, undefined, refresh) === true) setView("general");
  }

  /**
   * A suggestion's trash: the daemon records it as dismissed and its line leaves the first mate's file,
   * and the list takes what the daemon answers with at once rather than waiting for the next load.
   */
  function dismissSuggestion(suggestion: Suggestion): Promise<void> {
    return removeSuggestions(suggestion)
      .then((result) => {
        queryClient.setQueryData<Fleet>(FLEET_QUERY_KEY, (current) =>
          current === undefined ? current : { ...current, suggestions: result.suggestions },
        );
        refresh();
      })
      .catch((caught: unknown) => {
        toast.error(errorText(caught));
        refresh();
      });
  }

  const styles = useMemo(() => {
    const { colors } = theme;
    return {
      screen: { flex: 1, backgroundColor: colors.surface0 },
      header: {
        minHeight: HEADER_HEIGHT,
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
      body: { flex: 1, minHeight: 0 },
      note: { color: colors.foregroundMuted, fontSize: FONT_SIZE.body, padding: 20 },
      list: { width: "100%" as const, maxWidth: 720, alignSelf: "center" as const, padding: compact ? 10 : 14, paddingBottom: 24 },
    };
  }, [theme, compact]);

  const openAgentId = openCard?.agent?.id;
  const mateId = mate?.id;
  const openSettings = boundSettingsOpener();
  const menu: BoardMenuEntry[] = [
    ...(data === null || mate === null
      ? []
      : [
          {
            id: "suggestions",
            icon: SUGGESTIONS_ICON,
            label: SUGGESTIONS_TITLE,
            count: data.suggestions.length,
            onPress: () => setView("suggestions"),
          },
          { id: "watches", icon: WATCHES_ICON, label: WATCHES_TITLE, count: data.watches.length, onPress: () => setView("watches") },
          { id: "files", icon: "Folder", label: VIEW_TITLES.files, onPress: () => setView("files") },
        ]),
    ...(mateId === undefined || navigation === undefined
      ? []
      : [
          {
            id: "open-mate",
            icon: "ExternalLink",
            label: "Open the first mate in Paseo",
            onPress: () => navigation.openAgent({ agentId: mateId }),
          },
        ]),
    { id: "refresh", icon: "RefreshCw", label: "Refresh", onPress: refresh },
    ...(openSettings === null
      ? []
      : [{ id: "settings", icon: "Settings", label: "FirstMate settings", onPress: () => openSettings("firstmate") }]),
  ];

  const topicsView: TopicsView | null = view === "board" || view === "general" ? view : null;
  /** A topic, or a view from the menu: the header then leads back. */
  const away = openCard !== null || topicsView === null;
  const back = openCard !== null ? "board" : backTo;
  const views: ReadonlyArray<{ value: TopicsView; label: string }> = [
    { value: "board", label: "Board" },
    // The first mate has said something the captain has not had on screen.
    { value: "general", label: mate?.requiresAttention === true && !chatShown ? "General chat •" : "General chat" },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.header} onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
        {away ? (
          <IconButton
            icon="ArrowLeft"
            label={back === "general" ? "General chat" : "Board"}
            showLabel
            theme={theme}
            onPress={() => (openCard === null ? setView(back) : setOpen(null))}
          />
        ) : null}
        {/* On a phone the host's own bar already names the screen; only what is open over the board needs its name here. */}
        {compact && !away ? null : (
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {openCard === null ? VIEW_TITLES[view] : openCard.title}
          </Text>
        )}
        {mate === null || (compact && away) ? null : (
          <Segmented
            theme={theme}
            quiet
            value={openCard === null ? topicsView : null}
            options={views}
            onChange={setView}
          />
        )}
        {/* Said only when it is news: an idle first mate is the board as the captain expects it. */}
        {compact || mate === null || agentStatusLabel(mate) === "idle" ? null : (
          <Chip theme={theme} text={`First mate · ${agentStatusLabel(mate)}`} color={agentStatusTone(theme, mate)} />
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
          <IconButton icon="Menu" label="More" showLabel={!compact} theme={theme} onPress={() => setMenuOpen(!menuOpen)} />
        )}
        {compact && away ? null : (
          <Text style={styles.host} numberOfLines={1}>
            {compact ? host.label : `Host: ${host.label}`}
          </Text>
        )}
      </View>
      <MateBanners
        fleet={data}
        error={fleet.error}
        theme={theme}
        compact={compact}
        onShowChat={chatShown ? null : () => setView("general")}
        onOpenFile={openFile}
        onChanged={refresh}
      />
      <View style={styles.body}>
        {data === null ? (
          <Text style={styles.note}>{fleet.error === null ? "Loading the topics…" : ""}</Text>
        ) : mate === null ? (
          <ScrollView automaticallyAdjustKeyboardInsets>
            <LaunchPanel theme={theme} compact={compact} home={data.home} onLaunched={refresh} />
          </ScrollView>
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
        ) : view === "general" ? (
          <MateChat
            key={mate.id}
            mate={mate}
            theme={theme}
            compact={compact}
            hiddenKinds={values.hiddenChatKinds}
            threads={threads}
            onChanged={refresh}
            onOpenFile={openFile}
          />
        ) : view === "files" ? (
          <FilesView theme={theme} compact={compact} request={filesRequest} />
        ) : view === "suggestions" ? (
          data.suggestions.length === 0 ? (
            <Text style={styles.note}>The first mate has no suggestions now.</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              <SuggestionList
                suggestions={data.suggestions}
                theme={theme}
                disabled={mateSender.sending}
                onPick={suggest}
                onRemove={dismissSuggestion}
              />
            </ScrollView>
          )
        ) : data.watches.length === 0 ? (
          <Text style={styles.note}>The first mate's home has no watch scripts.</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            <WatchList watches={data.watches} theme={theme} onChanged={refresh} onOpenFile={openFile} />
          </ScrollView>
        )}
      </View>
      {menuOpen ? <BoardMenuList theme={theme} entries={menu} top={headerHeight} onClose={() => setMenuOpen(false)} /> : null}
    </View>
  );
}
