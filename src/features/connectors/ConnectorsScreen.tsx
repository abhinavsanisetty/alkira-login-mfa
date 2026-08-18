import { useCallback, useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { AvatarStack } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/features/auth";
import { ApiError, connectorsApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { can } from "@/lib/permissions";
import { connectorSchema } from "@/lib/schemas";
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

  // Rename lives in three pieces rather than one object because they change on
  // different events: which row is open, what has been typed, and what the last
  // attempt rejected. Bundling them means every keystroke rewrites the error.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);

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

  function startRename(connector: Connector) {
    setEditingId(connector.id);
    setDraftName(connector.name);
    setDraftError(null);
  }

  function cancelRename() {
    setEditingId(null);
    setDraftError(null);
  }

  async function saveRename(id: string) {
    // Validated here as well as in the handler, using the same schema. The
    // client check is for feedback; the one in the mock is the one that would
    // survive a request the UI never made.
    const parsed = connectorSchema.safeParse({ name: draftName });
    if (!parsed.success) {
      setDraftError(parsed.error.issues[0]?.message ?? "That name is not valid.");
      return;
    }

    setBusyId(id);
    setDraftError(null);
    try {
      const updated = await connectorsApi.update(id, parsed.data);
      setConnectors((current) => (current ?? []).map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
    } catch (cause) {
      // A duplicate name comes back as 409 with a message worth showing
      // verbatim, so the field keeps the error rather than the page-level Alert.
      setDraftError(
        cause instanceof ApiError ? cause.detail.message : "Could not rename the connector.",
      );
    } finally {
      setBusyId(null);
    }
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
                  const editing = connector.id === editingId;
                  const draftErrorId = `${connector.id}-name-error`;

                  return (
                    <tr key={connector.id} data-selected={selected || undefined}>
                      <td className={cn(cell, first)}>
                        {editing ? (
                          <div className="flex flex-col gap-1">
                            <Input
                              size="sm"
                              autoFocus
                              aria-label={`Rename ${connector.name}`}
                              value={draftName}
                              invalid={Boolean(draftError)}
                              aria-describedby={draftError ? draftErrorId : undefined}
                              onChange={(event) => setDraftName(event.target.value)}
                              // Enter and Escape are what anyone renaming
                              // something in place will reach for first, so the
                              // Save and Cancel buttons are the discoverable
                              // path rather than the only one.
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  void saveRename(connector.id);
                                }
                                if (event.key === "Escape") cancelRename();
                              }}
                            />
                            {draftError ? (
                              <p id={draftErrorId} role="alert" className="text-xs font-medium text-danger">
                                {draftError}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          /*
                            The row's name doubles as the selection control.

                            Selection could have lived on a click handler on the
                            <tr>, and it would have looked the same, but a row is
                            not focusable and cannot be reached or toggled from a
                            keyboard. A real button carries focus, Enter and Space,
                            and aria-pressed for free, which is also the only way
                            the selected state reaches a screen reader: aria-selected
                            is not valid on a row inside a plain table, only inside
                            a grid.
                          */
                          <button
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setSelectedId(selected ? null : connector.id)}
                            className="text-left font-display text-lg font-semibold text-ink"
                          >
                            {connector.name}
                          </button>
                        )}
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
                            {editing ? (
                              <>
                                <Button size="sm" variant="secondary" onClick={cancelRename}>
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  loading={busyId === connector.id}
                                  loadingLabel="Saving"
                                  onClick={() => saveRename(connector.id)}
                                >
                                  Save
                                </Button>
                              </>
                            ) : (
                              <>
                                {/*
                                  Each control checks its own permission rather
                                  than relying on showActions, which only asks
                                  whether the column is worth rendering at all.
                                  With the three roles that exist today the two
                                  are equivalent, so this guard is unreachable
                                  and no test can catch its removal. It stays
                                  because the day a role gets delete without
                                  edit, the equivalence breaks and this is the
                                  line that keeps Edit hidden.
                                */}
                                {canEdit ? (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    icon="pencil"
                                    onClick={() => startRename(connector)}
                                  >
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
                              </>
                            )}
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
