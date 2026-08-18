import { useId, useState } from "react";

import { AvatarStack } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FieldError } from "@/components/ui/TextField";
import { cn } from "@/lib/cn";
import { connectorSchema } from "@/lib/schemas";

import type { Connector, ConnectorStatus } from "./types";

const STATUS_TONE: Record<ConnectorStatus, "ok" | "warn" | "neutral"> = {
  connected: "ok",
  degraded: "warn",
  provisioning: "neutral",
};

const CELL = "border-y border-rule bg-surface px-4 py-3.5";
const LAST = "rounded-r-sm border-r";

interface ConnectorRowProps {
  connector: Connector;
  selected: boolean;
  editing: boolean;
  busy: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onStartRename: () => void;
  onCancelRename: () => void;
  onRename: (name: string) => Promise<string | null>;
  onDelete: () => void;
}

export function ConnectorRow({
  connector,
  selected,
  editing,
  busy,
  canEdit,
  canDelete,
  onSelect,
  onStartRename,
  onCancelRename,
  onRename,
  onDelete,
}: ConnectorRowProps) {
  const [draft, setDraft] = useState(connector.name);
  const [draftError, setDraftError] = useState<string | null>(null);
  const errorId = useId();
  const showActions = canEdit || canDelete;

  function start() {
    setDraft(connector.name);
    setDraftError(null);
    onStartRename();
  }

  async function save() {
    // Validated here as well as in the handler, using the same schema. This one
    // is for feedback; the handler's is the one that survives a request the UI
    // never made.
    const parsed = connectorSchema.safeParse({ name: draft });
    if (!parsed.success) {
      setDraftError(parsed.error.issues[0]?.message ?? "That name is not valid.");
      return;
    }
    setDraftError(await onRename(parsed.data.name));
  }

  return (
    <tr data-selected={selected || undefined}>
      <td
        className={cn(
          CELL,
          "rounded-l-sm border-l-[3px]",
          // Selection is a left edge and nothing else: a filled row would fight
          // the status badge sitting inside it.
          selected ? "border-l-royal" : "border-l-rule",
        )}
      >
        {editing ? (
          <div className="flex flex-col gap-1">
            <Input
              size="sm"
              autoFocus
              aria-label={`Rename ${connector.name}`}
              value={draft}
              invalid={Boolean(draftError)}
              aria-describedby={draftError ? errorId : undefined}
              onChange={(event) => setDraft(event.target.value)}
              // Enter and Escape are what anyone renaming in place reaches for
              // first; the buttons are the discoverable path, not the only one.
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void save();
                }
                if (event.key === "Escape") onCancelRename();
              }}
            />
            {draftError ? <FieldError id={errorId}>{draftError}</FieldError> : null}
          </div>
        ) : (
          // A button rather than a click handler on the <tr>: a row is not
          // focusable, and aria-selected is invalid on a row outside a grid, so
          // aria-pressed is the only way this state reaches a screen reader.
          <button
            type="button"
            aria-pressed={selected}
            onClick={onSelect}
            className="text-left font-display text-lg font-semibold text-ink"
          >
            {connector.name}
          </button>
        )}
      </td>

      <td className={cn(CELL, "text-muted")}>{connector.type}</td>
      <td className={cn(CELL, "font-mono text-xs text-muted")}>{connector.region}</td>
      <td className={CELL}>
        <AvatarStack names={connector.owners} />
      </td>
      <td className={cn(CELL, !showActions && LAST)}>
        <Badge tone={STATUS_TONE[connector.status]} dot>
          {connector.status}
        </Badge>
      </td>

      {showActions ? (
        <td className={cn(CELL, LAST)}>
          <div className="flex justify-end gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={onCancelRename}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" loading={busy} loadingLabel="Saving" onClick={save}>
                  Save
                </Button>
              </>
            ) : (
              <>
                {/* Each control checks its own permission as well as sitting
                    behind the Actions column. With today's roles the two are
                    equivalent, so no test can catch removing this; it stays for
                    the day a role gets delete without edit. */}
                {canEdit ? (
                  <Button size="sm" icon="pencil" onClick={start}>
                    Edit
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button size="sm" variant="danger" icon="trash" loading={busy} onClick={onDelete}>
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
}
