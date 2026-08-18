import { useCallback, useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { AvatarStack } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/features/auth";
import { connectorsApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { can } from "@/lib/permissions";
import type { Connector, ConnectorStatus } from "@/mocks/data";

const STATUS_TONE: Record<ConnectorStatus, "ok" | "warn" | "neutral"> = {
  connected: "ok",
  degraded: "warn",
  provisioning: "neutral",
};

const COLUMNS = 6;

export function ConnectorsScreen() {
  const user = useCurrentUser();
  const [connectors, setConnectors] = useState<Connector[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
      .create({
        name: `new-connector-${Date.now() % 1000}`,
        type: "AWS",
        region: "us-west-2",
        owners: user ? [user.name] : [],
      })
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
      setSelectedId((current) => (current === id ? null : current));
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
          <h1 className="text-xl font-semibold text-ink">Cloud connectors</h1>
          <p className="mt-1 text-sm text-gray">
            {canEdit
              ? "You have read and write access."
              : "You have read-only access. Edit actions are hidden."}
          </p>
        </div>
        {canCreate ? (
          <Button variant="primary" size="sm" icon="plus" onClick={create}>
            New connector
          </Button>
        ) : null}
      </div>

      {error ? <Alert className="mt-4">{error}</Alert> : null}

      {/*
        A table for the semantics, styled as a stack of layered rows.

        border-separate with vertical spacing is what turns the rows into
        discrete sections: each one sits on its own raised surface with a
        hairline around it, separated by the page ground rather than by a
        divider line. Nothing here is a hard black rule, and the whole thing
        stays a real <table>, so column headers, row relationships, and screen
        reader navigation survive the visual treatment intact.

        The alternative, a grid of <div>s, would have looked identical and
        thrown away every one of those semantics.
      */}
      <div aria-busy={connectors === null} className="mt-5 overflow-x-auto">
        <table className="w-full min-w-3xl border-separate border-spacing-y-1.5 text-left text-sm">
          <thead className="text-2xs font-semibold uppercase tracking-[0.07em] text-gray">
            <tr>
              <th scope="col" className="px-4 pb-1 font-semibold">
                Name
              </th>
              <th scope="col" className="px-4 pb-1 font-semibold">
                Type
              </th>
              <th scope="col" className="px-4 pb-1 font-semibold">
                Region
              </th>
              <th scope="col" className="px-4 pb-1 font-semibold">
                Owners
              </th>
              <th scope="col" className="px-4 pb-1 font-semibold">
                Status
              </th>
              {showActions ? (
                <th scope="col" className="px-4 pb-1 text-right font-semibold">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {connectors === null
              ? Array.from({ length: 4 }, (_, index) => (
                  <tr key={index}>
                    {Array.from({ length: showActions ? COLUMNS : COLUMNS - 1 }, (_, cell) => (
                      <td
                        key={cell}
                        className={cn(
                          "border-y border-rule bg-surface px-4 py-3.5",
                          cell === 0 && "rounded-l-sm border-l-[3px] border-l-rule",
                          cell === (showActions ? COLUMNS : COLUMNS - 1) - 1 &&
                            "rounded-r-sm border-r",
                        )}
                      >
                        <Skeleton className="h-3 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              : connectors.map((connector) => {
                  const selected = connector.id === selectedId;

                  // Selection is marked by a royal edge down the left of the
                  // row and nothing else. A filled row would fight the status
                  // badge sitting inside it, and tinting the whole surface
                  // would make selection compete with status for the same
                  // signal. The edge is unambiguous and costs no contrast.
                  const cell = "border-y border-rule bg-surface px-4 py-3.5";
                  const first = cn(
                    "rounded-l-sm border-l-[3px]",
                    selected ? "border-l-royal" : "border-l-rule",
                  );
                  const last = "rounded-r-sm border-r";

                  return (
                    <tr key={connector.id} data-selected={selected || undefined}>
                      <td className={cn(cell, first)}>
                        {/*
                          The row's name doubles as the selection control.

                          Selection could have lived on a click handler on the
                          <tr>, and it would have looked the same, but a row is
                          not focusable and cannot be reached or toggled from a
                          keyboard. A real button carries focus, Enter and Space,
                          and aria-pressed for free, which is also the only way
                          the selected state reaches a screen reader: aria-selected
                          is not valid on a row inside a plain table, only inside
                          a grid.
                        */}
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setSelectedId(selected ? null : connector.id)}
                          className="text-left font-display text-lg font-semibold text-ink"
                        >
                          {connector.name}
                        </button>
                      </td>
                      <td className={cn(cell, "text-muted")}>{connector.type}</td>
                      <td className={cn(cell, "font-mono text-xs text-muted")}>
                        {connector.region}
                      </td>
                      <td className={cell}>
                        <AvatarStack
                          names={connector.owners}
                          onAdd={canEdit ? () => undefined : undefined}
                          addLabel={`Add owner to ${connector.name}`}
                        />
                      </td>
                      <td className={cn(cell, !showActions && last)}>
                        <Badge tone={STATUS_TONE[connector.status]} dot>
                          {connector.status}
                        </Badge>
                      </td>
                      {showActions ? (
                        <td className={cn(cell, last)}>
                          <div className="flex justify-end gap-2">
                            {canEdit ? (
                              <Button size="sm" variant="secondary" icon="pencil">
                                Edit
                              </Button>
                            ) : null}
                            {canDelete ? (
                              <Button
                                size="sm"
                                variant="danger"
                                icon="trash"
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
                  );
                })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
