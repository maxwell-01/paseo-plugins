/**
 * The sidebar item: the FirstMate row, with a badge counting the crewmates
 * that are working or idle, and none while that is zero.
 *
 * It reads the board's own fleet query, so with the screen or a panel open the
 * three poll once between them; with neither open, it is what keeps the poll
 * going.
 */
import type { PluginTheme } from "@getpaseo/plugin";
import type { PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { useSettings } from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { useMemo } from "react";
import { Text, View } from "react-native";

import { displaySettings } from "../shared/settings";
import { useFleet } from "./fleet";
import { FLEET_SCREEN_ID, activeCrewCount } from "./screen";
import { FONT_SIZE } from "./type-scale";

/** A sidebar row's count: muted for something to know, in the warning colour for something to act on. */
export function SidebarCount({ theme, count, label, urgent = false }: { theme: PluginTheme; count: number; label: string; urgent?: boolean }) {
  const styles = useMemo(
    () => ({
      badge: {
        minWidth: 18,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 9,
        alignItems: "center" as const,
        backgroundColor: urgent ? theme.colors.statusWarning : theme.colors.surface2,
      },
      badgeText: {
        color: urgent ? theme.colors.surface0 : theme.colors.foregroundMuted,
        fontSize: FONT_SIZE.caption,
        fontWeight: urgent ? ("700" as const) : ("600" as const),
      },
    }),
    [theme, urgent],
  );
  return (
    <View style={styles.badge} accessibilityLabel={label}>
      <Text style={styles.badgeText}>{count}</Text>
    </View>
  );
}

export function FleetSidebarItem({ theme, currentScreen, openScreen }: PluginSidebarItemProps) {
  const display = useSettings(displaySettings);
  const fleet = useFleet(display.status === "ready" ? display.values.pollSeconds : 5);
  const count = activeCrewCount(fleet.data?.cards ?? []);

  return (
    <SidebarRow
      icon="Ship"
      active={currentScreen?.screenId === FLEET_SCREEN_ID}
      trailing={
        count === 0 ? undefined : (
          <SidebarCount theme={theme} count={count} label={`${count} ${count === 1 ? "crewmate" : "crewmates"} working or idle`} />
        )
      }
      onPress={() => openScreen({ screenId: FLEET_SCREEN_ID })}
    />
  );
}
