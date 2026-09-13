import { Badge, Box, HStack, IconButton, Spinner, Text, VStack } from "@chakra-ui/react";
import { useSetAtom } from "jotai";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import type { EntityDetail, EntityRelation, Schema } from "../../../client";
import { ConfirmDeleteAction } from "../../../components/ConfirmDeleteAction";
import { EntityPicker } from "../EntityPicker";
import { worldEditorSelectedEntityAtom } from "../atom";
import { useRemoveRelation, useSetRelation } from "../hooks/useEntityMutations";

export function EntityRelationCard({
  entity,
  schema,
  relation,
}: {
  entity: EntityDetail;
  schema?: Schema;
  relation: EntityRelation;
}) {
  const setSelectedEntity = useSetAtom(worldEditorSelectedEntityAtom);
  const setRelation = useSetRelation(entity);
  const remove = useRemoveRelation(entity);
  const definition = schema?.relations.find((item) => item.id === relation.id);

  return (
    <Box borderWidth="1px" rounded="md" overflow="hidden">
      <HStack justify="space-between" gap="2" minH="8" px="3" py="1" bg="bg.subtle">
        <HStack gap="2" minW="0">
          <Text textStyle="sm" fontWeight="medium" truncate>
            {definition?.name ?? relation.name}
          </Text>
          {definition?.acyclic ? <Badge size="sm">Acyclic</Badge> : null}
        </HStack>
        <ConfirmDeleteAction
          subject={`relation ${definition?.name ?? relation.name}`}
          title={`Remove ${definition?.name ?? relation.name}?`}
          description={`This relation will be removed from Entity #${entity.index}.`}
          pending={remove.isPending || setRelation.isPending}
          onConfirm={() => remove.mutateAsync(relation.id)}
        />
      </HStack>
      <VStack align="stretch" gap="1" px="3" py="2" borderTopWidth="1px">
        <Text textStyle="xs" color="fg.muted">
          Target
        </Text>
        <HStack gap="2">
          <Box flex="1" minW="0">
            <EntityPicker
              value={relation.target}
              disabled={setRelation.isPending || remove.isPending}
              label={`Change target for ${definition?.name ?? relation.name}`}
              onChange={(target) => {
                if (
                  target.index !== relation.target.index ||
                  target.generation !== relation.target.generation
                ) {
                  setRelation.mutate({ relationId: relation.id, target });
                }
              }}
            />
          </Box>
          <IconButton
            size="sm"
            variant="outline"
            flex="none"
            aria-label={`Open ${relation.target.name || `Entity ${relation.target.index}`}`}
            onClick={() => setSelectedEntity(relation.target)}
          >
            <ExternalLinkIcon size={14} aria-hidden="true" />
          </IconButton>
        </HStack>
        {setRelation.isPending ? (
          <HStack gap="1" color="fg.muted">
            <Spinner size="xs" />
            <Text textStyle="xs">Changing target…</Text>
          </HStack>
        ) : null}
      </VStack>
    </Box>
  );
}
