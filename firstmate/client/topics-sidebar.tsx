/**
 * The sidebar's Topics row, with a count in the warning colour of the topics that wait on the captain, and
 * none while that is zero. It reads the board's own fleet query, as the FirstMate row does.
 */
import type { PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { useSettings } from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";

import { displaySettings } from "../shared/settings";
import { useFleet } from "./fleet";
import { TOPICS_SCREEN_ID, needsYouCount } from "./screen";
import { SidebarCount } from "./sidebar";

export function TopicsSidebarItem({ theme, currentScreen, openScreen }: PluginSidebarItemProps) {
  const display = useSettings(displaySettings);
  const fleet = useFleet(display.status === "ready" ? display.values.pollSeconds : 5);
  const count = needsYouCount(fleet.data?.cards ?? []);

  return (
    <SidebarRow
      icon="MessagesSquare"
      active={currentScreen?.screenId === TOPICS_SCREEN_ID}
      trailing={
        count === 0 ? undefined : (
          <SidebarCount theme={theme} urgent count={count} label={`${count} ${count === 1 ? "topic needs" : "topics need"} you`} />
        )
      }
      onPress={() => openScreen({ screenId: TOPICS_SCREEN_ID })}
    />
  );
}
