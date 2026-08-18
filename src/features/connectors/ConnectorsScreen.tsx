import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/features/auth";
import { can } from "@/lib/permissions";

import { ConnectorRow } from "./ConnectorRow";
import { useConnectors } from "./useConnectors";

const HEADINGS = ["Name", "Type", "Region", "Owners", "Status"] as const;

export function ConnectorsScreen() {
  const user = useCurrentUser();
  const { connectors, error, setError, busyId, creating, create, rename, remove } = useConnectors();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Derived, never stored. A stored `canEdit` would go stale the moment the
  // role changed; this cannot. See DECISIONS.md §9.
  const canCreate = can(user, "connector:create");
  const canEdit = can(user, "connector:edit");
  const canDelete = can(user, "connector:delete");
  const showActions = canEdit || canDelete;
  const columns = showActions ? HEADINGS.length + 1 : HEADINGS.length;

  async function handleDelete(id: string) {
    setError(await remove(id));
    setSelectedId((current) => (current === id ? null : current));
  }

  async function handleRename(id: string, name: string) {
    const failure = await rename(id, name);
    if (!failure) setEditingId(null);
    return failure;
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
          <Button variant="primary" size="sm" icon="plus" loading={creating} onClick={create}>
            New connector
          </Button>
        ) : null}
      </div>

      {error ? <Alert className="mt-4">{error}</Alert> : null}

      {/* A real table for the semantics, styled as stacked sections:
          border-separate with vertical spacing puts each row on its own raised
          surface, separated by the page ground rather than by a divider. A grid
          of divs would look identical and throw away column headers and row
          relationships. */}
      <div aria-busy={connectors === null} className="mt-5 overflow-x-auto">
        <table className="w-full min-w-3xl border-separate border-spacing-y-1.5 text-left text-sm">
          <thead className="text-2xs font-semibold uppercase tracking-[0.07em] text-gray">
            <tr>
              {HEADINGS.map((heading) => (
                <th key={heading} scope="col" className="px-4 pb-1 font-semibold">
                  {heading}
                </th>
              ))}
              {showActions ? (
                <th scope="col" className="px-4 pb-1 text-right font-semibold">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {connectors === null
              ? Array.from({ length: 4 }, (_, row) => (
                  <tr key={row}>
                    {Array.from({ length: columns }, (_, cell) => (
                      <td
                        key={cell}
                        className={[
                          "border-y border-rule bg-surface px-4 py-3.5",
                          cell === 0 ? "rounded-l-sm border-l-[3px] border-l-rule" : "",
                          cell === columns - 1 ? "rounded-r-sm border-r" : "",
                        ].join(" ")}
                      >
                        <Skeleton className="h-3 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              : connectors.map((connector) => (
                  <ConnectorRow
                    key={connector.id}
                    connector={connector}
                    selected={connector.id === selectedId}
                    editing={connector.id === editingId}
                    busy={busyId === connector.id}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onSelect={() =>
                      setSelectedId((current) => (current === connector.id ? null : connector.id))
                    }
                    onStartRename={() => setEditingId(connector.id)}
                    onCancelRename={() => setEditingId(null)}
                    onRename={(name) => handleRename(connector.id, name)}
                    onDelete={() => handleDelete(connector.id)}
                  />
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
