import { Badge, Button, Field, HStack, Text, VStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { EntityDetail, EntityRef, RelationDef, Schema } from '../../lib/siecs/types';
import { MutationDialog } from '../../components/MutationDialog';
import { SearchableListbox } from '../../components/SearchableListbox';
import { EntityPicker } from './EntityPicker';
import { getAddableRelations } from './entityOptions';
import { useSetRelation } from './api/entityMutations';

export function AddRelationDialog({ entity, schema }: { entity: EntityDetail; schema: Schema }) {
  const [selectedId, setSelectedId] = useState<number>();
  const [target, setTarget] = useState<EntityRef>();
  const mutation = useSetRelation(entity);
  const available = getAddableRelations(schema.relations, entity.relations, '');
  const selected = available.find((relation) => relation.id === selectedId);

  const reset = () => {
    setSelectedId(undefined);
    setTarget(undefined);
  };

  return (
    <MutationDialog
      title="Add relation"
      trigger={
        <Button size="xs" variant="ghost" aria-label="Add relation">
          <Plus size={14} aria-hidden="true" />
          Add
        </Button>
      }
      pending={mutation.isPending}
      canSubmit={selected !== undefined && target !== undefined}
      onClose={reset}
      submit={async () => {
        if (!selected || !target) return;
        await mutation.mutateAsync({ relationId: selected.id, target, isNew: true });
      }}
    >
      <VStack align="stretch" gap="4">
        <VStack align="stretch" gap="2">
          <Text textStyle="sm" fontWeight="medium">
            Relation
          </Text>
          <SearchableListbox
            items={available}
            value={selected}
            searchPlaceholder="Search relations..."
            getKey={(relation) => relation.id}
            getLabel={(relation) => relation.name}
            filter={(relation, normalized) => relation.name.toLowerCase().includes(normalized)}
            emptyText="No relations available"
            onChange={(relation) => setSelectedId(relation?.id)}
            renderItem={(relation) => <RelationOption relation={relation} />}
          />
        </VStack>
        <Field.Root disabled={!selected}>
          <Field.Label>Target</Field.Label>
          <EntityPicker
            value={target}
            onChange={setTarget}
            disabled={!selected || mutation.isPending}
            label="Search entity..."
          />
        </Field.Root>
        {target ? (
          <Text textStyle="sm" color="fg.muted">
            Selected: {target.name || 'Entity'} #{target.index}
          </Text>
        ) : null}
      </VStack>
    </MutationDialog>
  );
}

function RelationOption({ relation }: { relation: RelationDef }) {
  return (
    <>
      <Text flex="1" truncate>
        {relation.name}
      </Text>
      <HStack gap="1">
        {relation.acyclic ? <Badge>Acyclic</Badge> : null}
        <Badge variant="outline">#{relation.id}</Badge>
      </HStack>
    </>
  );
}
