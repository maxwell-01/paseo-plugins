/**
 * The board header's menu: what the captain looks at now and then, kept off the board itself. Each entry
 * opens a view in the board's place or acts at once. The list drops down under the button and closes on a
 * choice or a press anywhere else.
 */
import type { PluginTheme } from "@getpaseo/plugin";
import { Icon } from "@getpaseo/plugin/client/react-native";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { FONT_SIZE } from "./type-scale";

export interface BoardMenuEntry {
  id: string;
  icon: string;
  label: string;
  /** How many there are, written after the label; left out for an entry that counts nothing. */
  count?: number;
  onPress: () => void;
}

/**
 * A screen is given no way to open a settings screen, so the entry lends it one; the menu leaves Settings
 * out while nothing is bound. Cleared in the entry's cleanup, since this module outlives a disconnected
 * client's context.
 */
let settingsOpener: ((id: string) => void) | null = null;
export function bindSettingsOpener(opener: ((id: string) => void) | null): void {
  settingsOpener = opener;
}
export function boundSettingsOpener(): ((id: string) => void) | null {
  return settingsOpener;
}

/** The open list. A child of the screen itself, drawn last, so it lies over the board and its backdrop fills the screen. */
export function BoardMenuList({
  theme,
  entries,
  top,
  onClose,
}: {
  theme: PluginTheme;
  entries: readonly BoardMenuEntry[];
  /** The header's height: the list hangs from its lower edge. */
  top: number;
  onClose: () => void;
}) {
  const styles = useMemo(() => {
    const { colors } = theme;
    return {
      backdrop: { position: "absolute" as const, top: 0, right: 0, bottom: 0, left: 0 },
      list: {
        position: "absolute" as const,
        top,
        right: 10,
        minWidth: 220,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        backgroundColor: colors.surface1,
      },
      entry: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, paddingHorizontal: 12, paddingVertical: 9 },
      label: { flex: 1, color: colors.foreground, fontSize: FONT_SIZE.body },
      count: { color: colors.foregroundMuted, fontSize: FONT_SIZE.small },
    };
  }, [theme, top]);

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Close the menu" style={styles.backdrop} onPress={onClose} />
      <View accessibilityRole="menu" style={styles.list}>
        {entries.map((entry) => (
          <Pressable
            key={entry.id}
            accessibilityRole="menuitem"
            style={styles.entry}
            onPress={() => {
              onClose();
              entry.onPress();
            }}
          >
            <Icon name={entry.icon} size={15} color={theme.colors.foregroundMuted} />
            <Text style={styles.label}>{entry.label}</Text>
            {entry.count === undefined ? null : <Text style={styles.count}>{entry.count}</Text>}
          </Pressable>
        ))}
      </View>
    </>
  );
}
