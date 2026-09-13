import { useAtomValue } from 'jotai';
import { ComponentView } from './ComponentView';
import { worldEditorStateAtom } from './atom';
import { EntityView } from './EntityView';
import { RelationView } from './RelationView';

export function WorldEditorPaneRight() {
  const editorState = useAtomValue(worldEditorStateAtom);

  return editorState === 'entity' ? (
    <EntityView />
  ) : editorState === 'relation' ? (
    <RelationView />
  ) : (
    <ComponentView />
  );
}
