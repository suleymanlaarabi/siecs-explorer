import { useSetAtom } from 'jotai';
import { DefinitionList } from '../../shared/components/DefinitionList';
import { useSchemaQuery } from './api/schemaQueries';
import { worldSelectionAtom } from './model/worldEditorState';

export function RelationList() {
  const { data } = useSchemaQuery();
  const setSelection = useSetAtom(worldSelectionAtom);
  return (
    <DefinitionList
      items={data?.relations ?? []}
      onSelect={(item) => setSelection(item ? { type: 'relation', id: item.id } : undefined)}
    />
  );
}
