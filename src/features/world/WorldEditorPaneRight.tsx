import { useAtomValue } from 'jotai';
import { ComponentView } from './ComponentView';
import { worldSelectionAtom } from './model/worldEditorState';
import { EntityView } from './EntityView';
import { RelationView } from './RelationView';

export function WorldEditorPaneRight() {
  const selection = useAtomValue(worldSelectionAtom);

  return selection?.type === 'entity' ? (
    <EntityView />
  ) : selection?.type === 'relation' ? (
    <RelationView />
  ) : selection?.type === 'component' ? (
    <ComponentView />
  ) : null;
}
