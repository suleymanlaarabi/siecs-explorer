import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import {
  SiecsError,
  siecsClient,
  type EntityComponent,
  type EntityDetail,
  type EntityLike,
  type EntityRef,
  type EntityRelation,
} from "../../../client";
import { toaster } from "../../../components/ui/toaster-provider";
import { worldEntityTreeRevisionAtom } from "../atom";

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
      updateEntity(queryClient, entity, (current) => addComponentToEntity(current, component));
      void queryClient.invalidateQueries({ queryKey: ["entities"] });
      toaster.create({ title: "Component added", type: "success" });
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
    onMutate: () =>
      queryClient.cancelQueries({
        queryKey: ["entity", entity.index, entity.generation],
        exact: true,
      }),
    onSuccess: (component) => {
      updateEntity(queryClient, entity, (current) => setComponentOnEntity(current, component));
    },
  });
}

export function useRemoveComponent(entity: EntityRef) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: entityMutationKey(entity, "remove-component"),
    mutationFn: (componentId: number) => siecsClient.removeComponent(entity, componentId),
    onSuccess: (_, componentId) => {
      updateEntity(queryClient, entity, (current) =>
        removeComponentFromEntity(current, componentId),
      );
      void queryClient.invalidateQueries({ queryKey: ["entities"] });
      toaster.create({ title: "Component removed", type: "success" });
    },
    onError: (error) => showMutationError("Unable to remove component", error),
  });
}

export function useSetRelation(entity: EntityRef) {
  const queryClient = useQueryClient();
  const invalidateTree = useSetAtom(worldEntityTreeRevisionAtom);
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
      updateEntity(queryClient, entity, (current) => setRelationOnEntity(current, relation));
      void queryClient.invalidateQueries({ queryKey: ["entities"] });
      invalidateTree((revision) => revision + 1);
      toaster.create({
        title: variables.isNew ? "Relation added" : "Relation changed",
        type: "success",
      });
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
  const invalidateTree = useSetAtom(worldEntityTreeRevisionAtom);
  return useMutation({
    mutationKey: entityMutationKey(entity, "remove-relation"),
    mutationFn: (relationId: number) => siecsClient.removeRelation(entity, relationId),
    onSuccess: (_, relationId) => {
      updateEntity(queryClient, entity, (current) => removeRelationFromEntity(current, relationId));
      void queryClient.invalidateQueries({ queryKey: ["entities"] });
      invalidateTree((revision) => revision + 1);
      toaster.create({ title: "Relation removed", type: "success" });
    },
    onError: (error) => showMutationError("Unable to remove relation", error),
  });
}

export function useIsEntityMutating(entity: EntityRef) {
  return useIsMutating({ mutationKey: entityMutationKey(entity) }) > 0;
}

function entityMutationKey(entity: EntityRef, action?: string) {
  return ["entity", entity.index, entity.generation, "mutation", ...(action ? [action] : [])];
}

function updateEntity(
  queryClient: ReturnType<typeof useQueryClient>,
  entity: EntityRef,
  update: (current: EntityDetail) => EntityDetail,
) {
  queryClient.setQueryData<EntityDetail>(["entity", entity.index, entity.generation], (current) =>
    current ? update(current) : current,
  );
}

function showMutationError(title: string, error: Error) {
  toaster.create({
    title,
    description: error.message,
    type: "error",
    closable: true,
  });
}
