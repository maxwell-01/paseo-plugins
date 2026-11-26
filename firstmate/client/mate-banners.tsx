/**
 * What is wrong or waiting above the board: a failed load, agent tools switched off, a first mate that is
 * gone or works outside its home, a question it asked while its chat is out of sight, a charter that has
 * moved on, and the daemon's own warnings. Draws nothing while there is none.
 */
import type { PluginTheme } from "@getpaseo/plugin";
import { useRpc } from "@getpaseo/plugin/client";
import { useToast } from "@getpaseo/plugin/client/react-native";
import { useMemo, useState, type ReactNode } from "react";
import { View } from "react-native";

import { acknowledgeCharter, compareCharter, enableAgentTools, type Fleet } from "../shared/fleet";
import { shortPath } from "./format";
import { Banner, errorText } from "./ui";

export function MateBanners({
  fleet,
  error,
  theme,
  compact,
  onShowChat,
  onOpenFile,
  onChanged,
}: {
  fleet: Fleet | null;
  /** Why the last load failed, or null. */
  error: unknown;
  theme: PluginTheme;
  compact: boolean;
  /** Brings the first mate's chat into view; null while it is already there, so its question needs no banner. */
  onShowChat: (() => void) | null;
  /** Opens a home file in the Files view: the charter's Compare puts the two side by side there. */
  onOpenFile: (path: string) => void;
  onChanged: () => void;
}) {
  const enable = useRpc(enableAgentTools);
  const compareCharters = useRpc(compareCharter);
  const acknowledgeCharters = useRpc(acknowledgeCharter);
  const toast = useToast();
  const [enabling, setEnabling] = useState(false);
  const [charterBusy, setCharterBusy] = useState(false);
  const mate = fleet?.mate ?? null;
  const style = useMemo(() => ({ paddingHorizontal: compact ? 10 : 14, paddingTop: 8, gap: 6 }), [compact]);

  function turnOnTools(): void {
    setEnabling(true);
    enable({})
      .then((result) => {
        toast.show(
          result.agentTools
            ? mate === null
              ? "Agent tools are on."
              : "Agent tools are on. The first mate gets them the next time its session starts — reload it from its tab."
            : "The daemon did not keep the change.",
          { variant: result.agentTools ? "success" : "warning" },
        );
        onChanged();
      })
      .catch((caught: unknown) => toast.error(errorText(caught)))
      .finally(() => setEnabling(false));
  }

  /** Puts the plugin's current charter beside the captain's and opens it in the Files view. */
  function compareCharterFiles(): void {
    setCharterBusy(true);
    compareCharters({})
      .then(({ path }) => {
        if (path === null) onChanged();
        else onOpenFile(path);
      })
      .catch((caught: unknown) => toast.error(errorText(caught)))
      .finally(() => setCharterBusy(false));
  }

  function acknowledgeCharterChange(): void {
    setCharterBusy(true);
    acknowledgeCharters({})
      .then(() => {
        toast.show("Your charter is now taken as up to date.", { variant: "success" });
        onChanged();
      })
      .catch((caught: unknown) => toast.error(errorText(caught)))
      .finally(() => setCharterBusy(false));
  }

  const banners: ReactNode[] = [];
  if (error !== null) banners.push(<Banner key="error" theme={theme} tone="danger" text={errorText(error)} />);
  if (fleet?.agentTools === false) {
    banners.push(
      <Banner
        key="tools"
        theme={theme}
        tone="warning"
        text="The first mate starts its crew and hears back from it through Paseo's agent tools, and this daemon does not give agents those tools."
        action={{ label: enabling ? "Turning on…" : "Turn them on", icon: "Wrench", onPress: turnOnTools, disabled: enabling }}
      />,
    );
  }
  if (fleet?.mateMissing === true) {
    banners.push(
      <Banner
        key="missing"
        theme={theme}
        tone="info"
        text="The first mate you had is gone — archived or deleted. Launch a new one; its records are still in its home."
      />,
    );
  }
  if (mate !== null && fleet !== null && !fleet.mateInHome) {
    banners.push(
      <Banner
        key="cwd"
        theme={theme}
        tone="warning"
        text={`The first mate works in ${shortPath(mate.cwd, 60)}, not in its home, so it has not read its charter there.`}
      />,
    );
  }
  if (mate !== null && mate.pendingPermissions > 0 && onShowChat !== null) {
    banners.push(
      <Banner
        key="permission"
        theme={theme}
        tone="warning"
        text="The first mate is waiting for your answer."
        action={{ label: "Show", icon: "MessageSquare", onPress: onShowChat }}
      />,
    );
  }
  if (fleet?.charterOutdated === true) {
    banners.push(
      <Banner
        key="charter"
        theme={theme}
        tone="info"
        text="FirstMate's own charter has changed since you edited yours in data/charter.md. Compare them, bring over what you want, then press Done."
        actions={[
          { label: "Compare", icon: "FileDiff", onPress: compareCharterFiles, disabled: charterBusy },
          { label: "Done", icon: "Check", onPress: acknowledgeCharterChange, disabled: charterBusy },
        ]}
      />,
    );
  }
  for (const warning of fleet?.warnings ?? []) {
    banners.push(<Banner key={warning} theme={theme} tone="warning" text={warning} />);
  }

  return banners.length === 0 ? null : <View style={style}>{banners}</View>;
}
