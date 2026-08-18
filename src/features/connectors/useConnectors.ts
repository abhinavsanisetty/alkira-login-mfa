import { useCallback, useEffect, useState } from "react";

import { ApiError, connectorsApi } from "@/lib/api";

import type { Connector } from "./types";

/**
 * Connector data and the three mutations against it.
 *
 * Split from the screen so the component is layout and the transport is here.
 * `connectors` is null until the first load resolves, which is what drives the
 * skeleton rows; an empty array would mean "loaded, none found".
 *
 * Every mutation reports failure the same way: it returns a message, or null on
 * success. Callers decide where to show it, which is why rename can put a
 * conflict under the field while delete puts it above the list.
 */
export function useConnectors() {
  const [connectors, setConnectors] = useState<Connector[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    connectorsApi
      .list()
      .then(setConnectors)
      .catch(() => setError("Could not load connectors."));
  }, []);

  /** Shared shape for the mutations: one in flight at a time, always cleared. */
  const run = useCallback(
    async (id: string, action: () => Promise<void>): Promise<string | null> => {
      setBusyId(id);
      setError(null);
      try {
        await action();
        return null;
      } catch (cause) {
        return cause instanceof ApiError ? cause.detail.message : "Something went wrong.";
      } finally {
        setBusyId(null);
      }
    },
    [],
  );

  // Keyed by a sentinel rather than an id, so the create button gets the same
  // double-submit protection every row action has.
  const create = useCallback(
    () =>
      run("new", async () => {
        const created = await connectorsApi.create({
          name: `new-connector-${Date.now() % 1000}`,
          type: "AWS",
          region: "us-west-2",
          owners: [],
        });
        setConnectors((current) => [created, ...(current ?? [])]);
      }),
    [run],
  );

  const rename = useCallback(
    (id: string, name: string) =>
      run(id, async () => {
        const updated = await connectorsApi.update(id, { name });
        setConnectors((current) => (current ?? []).map((c) => (c.id === id ? updated : c)));
      }),
    [run],
  );

  const remove = useCallback(
    (id: string) =>
      run(id, async () => {
        await connectorsApi.remove(id);
        setConnectors((current) => (current ?? []).filter((c) => c.id !== id));
      }),
    [run],
  );

  return { connectors, error, setError, busyId, creating: busyId === "new", create, rename, remove };
}
