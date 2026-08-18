import { useCallback, useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/features/auth";
import { connectorsApi } from "@/lib/api";
import { can } from "@/lib/permissions";
import type { Connector, ConnectorStatus } from "@/mocks/data";

const STATUS_TONE: Record<ConnectorStatus, "ok" | "warn" | "neutral"> = {
  connected: "ok",
  degraded: "warn",
  provisioning: "neutral",
};

export function ConnectorsScreen() {
  const user = useCurrentUser();
  const [connectors, setConnectors] = useState<Connector[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Derived, never stored. A stored `canEdit` would go stale the moment the
  // role changed; this cannot. See DECISIONS.md §9.
  const canCreate = can(user, "connector:create");
  const canEdit = can(user, "connector:edit");
  const canDelete = can(user, "connector:delete");
  const showActions = canEdit || canDelete;

  const load = useCallback(async () => {
    try {
      setConnectors(await connectorsApi.list());
    } catch {
      setError("Could not load connectors.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    setError(null);
    const created = await connectorsApi
      .create({ name: `new-connector-${Date.now() % 1000}`, type: "AWS", region: "us-west-2" })
      .catch(() => null);
    if (created) setConnectors((current) => [created, ...(current ?? [])]);
    else setError("Could not create the connector.");
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await connectorsApi.remove(id);
      setConnectors((current) => (current ?? []).filter((c) => c.id !== id));
    } catch {
      setError("Could not delete the connector.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl text-ink">Cloud connectors</h1>
          <p className="mt-1 text-sm text-muted">
            {canEdit
              ? "You have read and write access."
              : "You have read-only access. Edit actions are hidden."}
          </p>
        </div>
        {canCreate ? (
          <Button variant="primary" size="sm" onClick={create}>
            New connector
          </Button>
        ) : null}
      </div>

      {error ? <Alert className="mt-4">{error}</Alert> : null}

      <div
        aria-busy={connectors === null}
        className="mt-5 overflow-x-auto rounded-sm border border-rule bg-surface"
      >
        <table className="w-full min-w-2xl text-left text-sm">
          <thead className="border-b border-rule text-2xs uppercase tracking-[0.07em] text-gray">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Name</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Type</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Region</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
              {showActions ? (
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Actions</th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {connectors === null
              ? Array.from({ length: 4 }, (_, index) => (
                  <tr key={index} className="border-b border-rule last:border-0">
                    {Array.from({ length: showActions ? 5 : 4 }, (_, cell) => (
                      <td key={cell} className="px-4 py-3">
                        <Skeleton className="h-3 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              : connectors.map((connector) => (
                  <tr key={connector.id} className="border-b border-rule last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{connector.name}</td>
                    <td className="px-4 py-3 text-muted">{connector.type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{connector.region}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[connector.status]} dot>
                        {connector.status}
                      </Badge>
                    </td>
                    {showActions ? (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {canEdit ? (
                            <Button size="sm" variant="secondary">
                              Edit
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              size="sm"
                              variant="danger"
                              loading={busyId === connector.id}
                              onClick={() => remove(connector.id)}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
