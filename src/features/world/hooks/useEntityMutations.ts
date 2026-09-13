import {
  useIsMutating,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  SiecsError,
  siecsClient,
  type Entity,
  type EntityComponent,
  type EntityDetail,
  type EntityLike,
  type EntityRef,
  type EntityRelation,
} from "../../../client";
import { toaster } from "../../../components/ui/toaster-provider";
import { entityKeys, isEntityChildrenQuery } from "../entityQueries";
import {
  markEntityHasChildren,
  moveEntityToParent,
  moveEntityToRoots,
  removeEntityFromParent,
  sameEntity,
} from "../hierarchyCache";

export function addComponentToEntity(entity: EntityDetail, component: EntityComponent) {
  return { ...entity, components: [...entity.components, component] };
}

export function setComponentOnEntity(entity: EntityDetail, component: EntityComponent) {
  return {
    ...entity,
    components: entity.components.map((item) => (item.id === component.id ? component : item)),
  };
}

export function removeComponentFromEntity(entity: EntityDetail, componentId: number) {
  return {
    ...entity,
    components: entity.components.filter((component) => component.id !== componentId),
  };
}

export function setRelationOnEntity(entity: EntityDetail, relation: EntityRelation) {
  const exists = entity.relations.some((item) => item.id === relation.id);
  return {
    ...entity,
    relations: exists
      ? entity.relations.map((item) => (item.id === relation.id ? relation : item))
      : [...entity.relations, relation],
  };
}

export function removeRelationFromEntity(entity: EntityDetail, relationId: number) {
  return {
    ...entity,
    relations: entity.relations.filter((relation) => relation.id !== relationId),
  };
}

export function useAddComponent(entity: EntityRef) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: entityMutationKey(entity, "add-component"),
    mutationFn: ({ componentId, value }: { componentId: number; value?: unknown }) =>
      siecsClient.addComponent(entity, componentId, value),
    onSuccess: (component) => {
      updateEntityCache(queryClient, entity, (current) => addComponentToEntity(current, component));
      invalidateEntity(queryClient, entity);
      showMutationSuccess("Component added");
    },
    onError: (error) => showMutationError("Unable to add component", error),
  });
}

export function useSetComponent(entity: EntityRef) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: entityMutationKey(entity, "set-component"),
    mutationFn: ({ componentId, value }: { componentId: number; value: unknown }) =>
      siecsClient.setComponent(entity, componentId, value),
    onSuccess: (component) => {
      updateEntityCache(queryClient, entity, (current) => setComponentOnEntity(current, component));
      invalidateEntity(queryClient, entity);
    },
    onError: (error) => showMutationError("Unable to save component", error),
  });
}

export function useRemoveComponent(entity: EntityRef) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: entityMutationKey(entity, "remove-component"),
    mutationFn: (componentId: number) => siecsClient.removeComponent(entity, componentId),
    onSuccess: (_, componentId) => {
      updateEntityCache(queryClient, entity, (current) =>
        removeComponentFromEntity(current, componentId),
      );
      invalidateEntity(queryClient, entity);
      showMutationSuccess("Component removed");
    },
    onError: (error) => showMutationError("Unable to remove component", error),
  });
}

export function useSetRelation(entity: EntityRef) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: entityMutationKey(entity, "set-relation"),
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
      if (relation.name === "ChildOf") {
        updateChildOfCache(queryClient, entity, previous, relation.target);
      }
      invalidateEntity(queryClient, entity);
      showMutationSuccess(variables.isNew ? "Relation added" : "Relation changed");
    },
    onError: (error) =>
      showMutationError(
        error instanceof SiecsError && error.status === 409
          ? "Relation would create a cycle"
          : "Unable to change relation",
        error,
      ),
  });
}

export function useRemoveRelation(entity: EntityRef) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: entityMutationKey(entity, "remove-relation"),
    mutationFn: (relationId: number) => siecsClient.removeRelation(entity, relationId),
    onSuccess: (_, relationId) => {
      const previous = queryClient.getQueryData<EntityDetail>(entityKeys.detail(entity));
      const relation = previous?.relations.find((item) => item.id === relationId);
      updateEntityCache(queryClient, entity, (current) =>
        removeRelationFromEntity(current, relationId),
      );
      if (relation?.name === "ChildOf") {
        removeChildOfCache(queryClient, entity, relation.target, previous);
      }
      invalidateEntity(queryClient, entity);
      showMutationSuccess("Relation removed");
    },
    onError: (error) => showMutationError("Unable to remove relation", error),
  });
}

export function useIsEntityMutating(entity: EntityRef) {
  return useIsMutating({ mutationKey: entityMutationKey(entity) }) > 0;
}

function updateChildOfCache(
  queryClient: QueryClient,
  entity: EntityRef,
  previous: EntityDetail | undefined,
  nextParent: EntityRef,
) {
  const previousChildOf = previous?.relations.find((relation) => relation.name === "ChildOf");
  const child = entityFromDetail(previous, entity);
  const oldParent = previousChildOf?.target;

  queryClient.setQueryData<Entity[]>(entityKeys.roots, (roots) =>
    roots ? roots.filter((item) => !sameEntity(item, entity)) : roots,
  );
  if (oldParent && !sameEntity(oldParent, nextParent)) {
    updateChildrenCache(queryClient, oldParent, (children) =>
      removeEntityFromParent(children, entity),
    );
    updateParentHasChildren(queryClient, oldParent);
    void queryClient.invalidateQueries({ queryKey: entityKeys.children(oldParent) });
  }
  updateChildrenCache(queryClient, nextParent, (children) => moveEntityToParent(children, child));
  updateParentHasChildren(queryClient, nextParent, true);
  void queryClient.invalidateQueries({ queryKey: entityKeys.roots });
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
  const cachedChildren = queryClient.getQueryData<Entity[]>(entityKeys.children(oldParent));
  updateParentHasChildren(
    queryClient,
    oldParent,
    cachedChildren ? cachedChildren.length > 0 : undefined,
  );
  queryClient.setQueryData<Entity[]>(entityKeys.roots, (roots = []) =>
    moveEntityToRoots(roots, entityFromDetail(previous, entity)),
  );
  void queryClient.invalidateQueries({ queryKey: entityKeys.children(oldParent) });
  void queryClient.invalidateQueries({ queryKey: entityKeys.roots });
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
  queryClient.setQueryData<Entity[]>(entityKeys.roots, (roots) =>
    roots && value !== undefined ? markEntityHasChildren(roots, parent, value) : roots,
  );
  queryClient.setQueryData<Entity[]>(entityKeys.all, (entities) =>
    entities && value !== undefined ? markEntityHasChildren(entities, parent, value) : entities,
  );
  if (value === undefined) return;
  queryClient.setQueriesData<Entity[]>(
    { queryKey: entityKeys.entity, predicate: (query) => isEntityChildrenQuery(query.queryKey) },
    (entities) => (entities ? markEntityHasChildren(entities, parent, value) : entities),
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
  return [...entityKeys.detail(entity), "mutation", ...(action ? [action] : [])];
}

function showMutationError(title: string, error: unknown) {
  toaster.create({
    title,
    description: error instanceof Error ? error.message : "Unknown error",
    type: "error",
    closable: true,
  });
}

function showMutationSuccess(title: string) {
  toaster.create({ title, type: "success" });
}
