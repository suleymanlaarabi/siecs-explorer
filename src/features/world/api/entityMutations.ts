import {
  useIsMutating,
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { siecsClient } from '../../../lib/siecs/client';
import { SiecsError } from '../../../lib/siecs/errors';
import type { Entity, EntityDetail, EntityLike, EntityRef } from '../../../lib/siecs/types';
import { showMutationError, showMutationSuccess } from '../../../shared/mutationFeedback';
import { entityKeys, isEntityChildrenQuery } from './queryKeys';
import {
  addComponentToEntity,
  removeComponentFromEntity,
  removeRelationFromEntity,
  setComponentOnEntity,
  setRelationOnEntity,
} from '../entities/entityCache';
import {
  markEntityHasChildren,
  moveEntityToParent,
  moveEntityToRoots,
  removeEntityFromParent,
} from '../entities/hierarchyCache';

export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...entityKeys.all, 'create'],
    mutationFn: () => siecsClient.createEntity(),
    onSuccess: (entity) => {
      queryClient.setQueryData<Entity[]>(entityKeys.roots(), (current = []) =>
        current.some((item) => item.index === entity.index) ? current : [...current, entity],
      );
      queryClient.setQueryData<Entity[]>(entityKeys.list(), (current = []) =>
        current.some((item) => item.index === entity.index) ? current : [...current, entity],
      );
      void queryClient.invalidateQueries({ queryKey: entityKeys.roots() });
      void queryClient.invalidateQueries({ queryKey: entityKeys.list() });
      showMutationSuccess('Entity created');
    },
    onError: (error) => showMutationError('Unable to create entity', error),
  });
}

export function useAddComponent(entity: EntityRef) {
  return useEntityMutation(entity, 'add-component', {
    mutationFn: ({ componentId, value }: { componentId: number; value?: unknown }) =>
      siecsClient.addComponent(entity, componentId, value),
    onSuccess: (queryClient, component) => {
      updateEntityCache(queryClient, entity, (current) => addComponentToEntity(current, component));
      showMutationSuccess('Component added');
    },
    errorTitle: 'Unable to add component',
  });
}

export function useSetComponent(entity: EntityRef) {
  return useEntityMutation(entity, 'set-component', {
    mutationFn: ({ componentId, value }: { componentId: number; value: unknown }) =>
      siecsClient.setComponent(entity, componentId, value),
    onSuccess: (queryClient, component) =>
      updateEntityCache(queryClient, entity, (current) => setComponentOnEntity(current, component)),
    errorTitle: 'Unable to save component',
  });
}

export function useRemoveComponent(entity: EntityRef) {
  return useEntityMutation(entity, 'remove-component', {
    mutationFn: (componentId: number) => siecsClient.removeComponent(entity, componentId),
    onSuccess: (queryClient, _, componentId) => {
      updateEntityCache(queryClient, entity, (current) =>
        removeComponentFromEntity(current, componentId),
      );
      showMutationSuccess('Component removed');
    },
    errorTitle: 'Unable to remove component',
  });
}

export function useSetRelation(entity: EntityRef) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: entityMutationKey(entity, 'set-relation'),
    mutationFn: ({
      relationId,
      target,
    }: {
      relationId: number;
      target: EntityLike;
      isNew?: boolean;
    }) => siecsClient.setRelation(entity, relationId, target),
    onSuccess: (relation, variables) => {
      const previous = queryClient.getQueryData<EntityDetail>(entityKeys.detail(entity));
      updateEntityCache(queryClient, entity, (current) => setRelationOnEntity(current, relation));
      if (relation.name === 'ChildOf')
        updateChildOfCache(queryClient, entity, previous, relation.target);
      invalidateEntity(queryClient, entity);
      showMutationSuccess(variables.isNew ? 'Relation added' : 'Relation changed');
    },
    onError: (error) =>
      showMutationError(
        error instanceof SiecsError && error.status === 409
          ? 'Relation would create a cycle'
          : 'Unable to change relation',
        error,
      ),
  });
}

export function useRemoveRelation(entity: EntityRef) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: entityMutationKey(entity, 'remove-relation'),
    mutationFn: (relationId: number) => siecsClient.removeRelation(entity, relationId),
    onSuccess: (_, relationId) => {
      const previous = queryClient.getQueryData<EntityDetail>(entityKeys.detail(entity));
      const relation = previous?.relations.find((item) => item.id === relationId);
      updateEntityCache(queryClient, entity, (current) =>
        removeRelationFromEntity(current, relationId),
      );
      if (relation?.name === 'ChildOf')
        removeChildOfCache(queryClient, entity, relation.target, previous);
      invalidateEntity(queryClient, entity);
      showMutationSuccess('Relation removed');
    },
    onError: (error) => showMutationError('Unable to remove relation', error),
  });
}

export function useIsEntityMutating(entity: EntityRef) {
  return useIsMutating({ mutationKey: entityMutationKey(entity) }) > 0;
}

function useEntityMutation<TData, TVariables>(
  entity: EntityRef,
  action: string,
  config: {
    mutationFn: (variables: TVariables) => Promise<TData>;
    onSuccess: (queryClient: QueryClient, data: TData, variables: TVariables) => void;
    errorTitle: string;
  },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: entityMutationKey(entity, action),
    mutationFn: config.mutationFn,
    onSuccess: (data, variables) => {
      config.onSuccess(queryClient, data, variables);
      invalidateEntity(queryClient, entity);
    },
    onError: (error) => showMutationError(config.errorTitle, error),
  });
}

function updateChildOfCache(
  queryClient: QueryClient,
  entity: EntityRef,
  previous: EntityDetail | undefined,
  nextParent: EntityRef,
) {
  const oldParent = previous?.relations.find((relation) => relation.name === 'ChildOf')?.target;
  const child = entityFromDetail(previous, entity);
  queryClient.setQueryData<Entity[]>(entityKeys.roots(), (roots) =>
    roots?.filter((item) => item.index !== entity.index),
  );
  if (oldParent && oldParent.index !== nextParent.index) {
    updateChildrenCache(queryClient, oldParent, (children) =>
      removeEntityFromParent(children, entity),
    );
    updateParentHasChildren(queryClient, oldParent);
  }
  updateChildrenCache(queryClient, nextParent, (children) => moveEntityToParent(children, child));
  updateParentHasChildren(queryClient, nextParent, true);
  void queryClient.invalidateQueries({ queryKey: entityKeys.roots() });
  void queryClient.invalidateQueries({ queryKey: entityKeys.children(nextParent) });
}

function removeChildOfCache(
  queryClient: QueryClient,
  entity: EntityRef,
  oldParent: EntityRef,
  previous: EntityDetail | undefined,
) {
  updateChildrenCache(queryClient, oldParent, (children) =>
    removeEntityFromParent(children, entity),
  );
  const children = queryClient.getQueryData<Entity[]>(entityKeys.children(oldParent));
  updateParentHasChildren(queryClient, oldParent, children ? children.length > 0 : undefined);
  queryClient.setQueryData<Entity[]>(entityKeys.roots(), (roots = []) =>
    moveEntityToRoots(roots, entityFromDetail(previous, entity)),
  );
  void queryClient.invalidateQueries({ queryKey: entityKeys.children(oldParent) });
  void queryClient.invalidateQueries({ queryKey: entityKeys.roots() });
}

function entityFromDetail(detail: EntityDetail | undefined, fallback: EntityRef): Entity {
  return {
    name: detail?.name ?? fallback.name,
    index: fallback.index,
    generation: fallback.generation,
    hasChildren: Boolean(detail?.children.length),
  };
}

function updateChildrenCache(
  queryClient: QueryClient,
  parent: EntityRef,
  update: (children: Entity[]) => Entity[],
) {
  queryClient.setQueryData<Entity[]>(entityKeys.children(parent), (children) =>
    children ? update(children) : children,
  );
}

function updateParentHasChildren(queryClient: QueryClient, parent: EntityRef, value?: boolean) {
  const update = (entities: Entity[] | undefined) =>
    entities && value !== undefined ? markEntityHasChildren(entities, parent, value) : entities;
  queryClient.setQueryData<Entity[]>(entityKeys.roots(), update);
  queryClient.setQueryData<Entity[]>(entityKeys.list(), update);
  if (value !== undefined)
    queryClient.setQueriesData<Entity[]>(
      { queryKey: entityKeys.all, predicate: (query) => isEntityChildrenQuery(query.queryKey) },
      update,
    );
}

function updateEntityCache(
  queryClient: QueryClient,
  entity: EntityRef,
  update: (current: EntityDetail) => EntityDetail,
) {
  queryClient.setQueryData<EntityDetail>(entityKeys.detail(entity), (current) =>
    current ? update(current) : current,
  );
}

function invalidateEntity(queryClient: QueryClient, entity: EntityRef) {
  void queryClient.invalidateQueries({ queryKey: entityKeys.detail(entity) });
}

function entityMutationKey(entity: EntityRef, action?: string) {
  return [...entityKeys.detail(entity), 'mutation', ...(action ? [action] : [])];
}
