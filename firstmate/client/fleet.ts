/**
 * The fleet query: everything the board, the workspace panels and the sidebar row draw comes from one RPC,
 * `firstmate.fleet.load`, polled at the interval in the display settings and refetched right after any
 * action. The three share the query, so they poll once between them.
 *
 * A screen is unmounted whenever the captain opens a workspace, so the last fleet lives in module scope
 * and the board comes back drawn rather than empty.
 */
import { useRpc } from "@getpaseo/plugin/client";
import { useQuery } from "@tanstack/react-query";

import { loadFleet, type Fleet } from "../shared/fleet";

export const FLEET_QUERY_KEY = ["firstmate", "fleet"] as const;

let cachedFleet: Fleet | null = null;

export function useFleet(pollSeconds: number) {
  const load = useRpc(loadFleet);
  return useQuery({
    queryKey: FLEET_QUERY_KEY,
    queryFn: function () {
      return load({}).then((fleet) => {
        cachedFleet = fleet;
        return fleet;
      });
    },
    refetchInterval: pollSeconds * 1000,
    ...(cachedFleet === null ? {} : { placeholderData: cachedFleet }),
  });
}
