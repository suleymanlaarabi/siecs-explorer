import { useSetAtom } from 'jotai';
import { DefinitionList } from '../../shared/components/DefinitionList';
import { useSchemaQuery } from './api/schemaQueries';
import { worldSelectionAtom } from './model/worldEditorState';

export function ComponentList() {
  const { data } = useSchemaQuery();
  const setSelection = useSetAtom(worldSelectionAtom);
  return (
    <DefinitionList
      items={data?.components ?? []}
      onSelect={(item) => setSelection(item ? { type: 'component', id: item.id } : undefined)}
    />
  );
}
