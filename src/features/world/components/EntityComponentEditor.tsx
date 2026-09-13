import { HStack, Spinner, Text, VStack } from "@chakra-ui/react";
import { Check, CircleAlert } from "lucide-react";
import { useState } from "react";
import type { ComponentDef, EntityComponent, EntityRef, Schema } from "../../../client";
import { useDebouncedAutosave } from "../../../hooks/useDebouncedAutosave";
import { ReflectedValueEditor } from "./ReflectedValueEditor";
import { useSetComponent } from "../hooks/useEntityMutations";

export function EntityComponentEditor({
  entity,
  component,
  schema,
  entityComponent,
}: {
  entity: EntityRef;
  component: ComponentDef;
  schema: Schema;
  entityComponent: EntityComponent;
}) {
  const { mutateAsync: saveComponent } = useSetComponent(entity);
  const [draft, setDraft] = useState(entityComponent.value);
  const autosave = useDebouncedAutosave({
    draft,
    remoteValue: entityComponent.value,
    onSave: async (value) => (await saveComponent({ componentId: component.id, value })).value,
    onRemoteSync: setDraft,
  });

  return (
    <VStack
      align="stretch"
      gap="4"
      onFocusCapture={() => autosave.setEditing(true)}
      onBlurCapture={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        autosave.setEditing(false);
      }}
    >
      <SaveStatus state={autosave.saveState} error={autosave.error} />
      <ReflectedValueEditor
        component={component}
        schema={schema}
        value={draft}
        onChange={(value) => {
          setDraft(value);
          autosave.update(value);
        }}
        onValidityChange={autosave.setValidity}
      />
    </VStack>
  );
}

function SaveStatus({ state, error }: { state: string; error?: string }) {
  if (state === "idle") return null;
  const text =
    state === "pending"
      ? "Modified…"
      : state === "saving"
        ? "Saving…"
        : state === "saved"
          ? "Saved"
          : error || "Save failed";
  return (
    <HStack
      gap="1"
      minH="4"
      color={state === "error" ? "fg.error" : "fg.muted"}
      aria-live="polite"
      title={state === "error" ? error : undefined}
    >
      {state === "saving" ? <Spinner size="xs" /> : null}
      {state === "saved" ? <Check size={12} aria-hidden="true" /> : null}
      {state === "error" ? <CircleAlert size={12} aria-hidden="true" /> : null}
      <Text textStyle="xs">{text}</Text>
    </HStack>
  );
}
