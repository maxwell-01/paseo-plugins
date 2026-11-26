/**
 * The Topics board: Needs you, Working, Queued and Done side by side across the whole screen, each a
 * plain list of topic cards under a small heading with its count. On a phone the columns stack into one
 * list and Done is left out: the phone is for what is live.
 *
 * Done draws only its newest topics (`shownDone`) and says how many older ones the backlog still holds.
 */
import type { PluginTheme } from "@getpaseo/plugin";
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";

import type { CardAction, FleetCard } from "../shared/fleet";
import { CAPTAIN_COLUMN_IDS, CAPTAIN_COLUMNS, groupCaptainCards, type CaptainColumnId } from "./format";
import { TopicCard } from "./topic-card";
import { shownDone, topicUnread } from "./topic-format";
import { FONT_SIZE } from "./type-scale";

export function TopicsBoard({
  cards,
  theme,
  compact,
  topicsRead,
  sending,
  onOpen,
  onAnswer,
}: {
  cards: readonly FleetCard[];
  theme: PluginTheme;
  compact: boolean;
  /** When the captain last had each topic open, by `readKey`; an unread dot is judged against it. */
  topicsRead: Readonly<Record<string, string>>;
  sending: boolean;
  onOpen: (card: FleetCard) => void;
  onAnswer: (card: FleetCard, action: CardAction) => void;
}) {
  const groups = useMemo(() => groupCaptainCards(cards), [cards]);
  const columns: readonly CaptainColumnId[] = compact
    ? CAPTAIN_COLUMN_IDS.filter((id) => id !== "done")
    : CAPTAIN_COLUMN_IDS;

  const styles = useMemo(() => {
    const { colors } = theme;
    return {
      scroll: { flex: 1 },
      board: compact
        ? { padding: 10, paddingBottom: 24, gap: 16 }
        : { flexDirection: "row" as const, alignItems: "flex-start" as const, padding: 14, gap: 12 },
      column: compact ? { gap: 8 } : { flex: 1, minWidth: 0, gap: 8 },
      heading: {
        color: colors.foregroundMuted,
        fontSize: FONT_SIZE.caption,
        fontWeight: "600" as const,
        letterSpacing: 0.5,
        textTransform: "uppercase" as const,
      },
      count: { fontWeight: "400" as const, opacity: 0.7 },
      older: { color: colors.foregroundMuted, fontSize: FONT_SIZE.caption, paddingHorizontal: 2 },
    };
  }, [theme, compact]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.board}>
      {columns.map((id) => {
        const all = groups.get(id) ?? [];
        const { shown, older } = id === "done" ? shownDone(all) : { shown: all, older: 0 };
        return (
          <View key={id} style={styles.column}>
            <Text style={styles.heading} accessibilityRole="header">
              {CAPTAIN_COLUMNS[id].title} <Text style={styles.count}>{all.length}</Text>
            </Text>
            {shown.map((card) => (
              <TopicCard
                key={card.key}
                card={card}
                theme={theme}
                unread={topicUnread(card, topicsRead)}
                sending={sending}
                onOpen={() => onOpen(card)}
                onAnswer={(action) => onAnswer(card, action)}
              />
            ))}
            {older === 0 ? null : (
              <Text style={styles.older}>
                {older} older {older === 1 ? "topic is" : "topics are"} in the backlog.
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
