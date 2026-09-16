import { Badge, Box, Button, Text, VStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { EntityDetail, Schema } from '../../lib/siecs/types';
import { MutationDialog } from '../../components/MutationDialog';
import { SearchableListbox } from '../../components/SearchableListbox';
import { ReflectedValueEditor } from './editor/ReflectedValueEditor';
import { getAddableComponents } from './entityOptions';
import { useAddComponent } from './api/entityMutations';

export function AddComponentDialog({ entity, schema }: { entity: EntityDetail; schema: Schema }) {
  const [selectedId, setSelectedId] = useState<number>();
  const [draft, setDraft] = useState<unknown>({});
  const [valid, setValid] = useState(true);
  const mutation = useAddComponent(entity);
  const available = useMemo(
    () => getAddableComponents(schema.components, entity.components, ''),
    [entity.components, schema.components],
  );
  const selected = schema.components.find((component) => component.id === selectedId);

  const editable = Boolean(
    selected &&
    selected.fields.length > 0 ,
  );

  const reset = () => {
    setSelectedId(undefined);
    setDraft({});
    setValid(true);
  };

  return (
    <MutationDialog
      title="Add component"
      trigger={
        <Button size="xs" variant="ghost">
          <Plus size={14} aria-hidden="true" />
          Add
        </Button>
      }
      pending={mutation.isPending}
      canSubmit={selected !== undefined && valid}
      onClose={reset}
      submit={async () => {
        if (!selected) return;
        await mutation.mutateAsync({
          componentId: selected.id,
          value: editable ? draft : undefined,
        });
      }}
    >
      <VStack align="stretch" gap="3">
        <SearchableListbox
          items={available}
          value={selected}
          searchPlaceholder="Search components..."
          getKey={(component) => component.id}
          getLabel={(component) => component.name}
          filter={(component, normalized) => component.name.toLowerCase().includes(normalized)}
          emptyText="No components available"
          onChange={(component) => {
            setSelectedId(component?.id);
            setDraft(component?.fields.length ? {} : undefined);
            setValid(true);
          }}
          renderItem={(component) => (
            <>
              <Text flex="1" truncate>
                {component.name}
              </Text>
              <Badge variant="outline">#{component.id}</Badge>
            </>
          )}
        />
        {selected ? (
          <Box borderWidth="1px" rounded="sm" p="3">
            <Text fontWeight="medium" mb="2">
              {selected.name}
            </Text>
            {editable ? (
              <ReflectedValueEditor
                component={selected}
                schema={schema}
                value={draft}
                onChange={setDraft}
                onValidityChange={setValid}
              />
            ) : (
              <Text textStyle="sm" color="fg.muted">
                Default value will be used
              </Text>
            )}
          </Box>
        ) : null}
      </VStack>
    </MutationDialog>
  );
}
