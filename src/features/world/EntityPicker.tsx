import { useState } from 'react';
import { Button, Popover, Portal, Text } from '@chakra-ui/react';
import { ChevronDown } from 'lucide-react';
import type { EntityLike, EntityRef } from '../../client';
import { SearchableListbox } from '../../components/SearchableListbox';
import { useAllEntities } from './entityQueries';

export function EntityPicker({
  value,
  onChange,
  disabled,
  label = 'Select entity',
}: {
  value?: EntityLike | undefined;
  onChange: (entity: EntityRef) => void;
  disabled?: boolean | undefined;
  label?: string | undefined;
}) {
  const entitiesQuery = useAllEntities();
  const [open, setOpen] = useState(false);
  const selected =
    typeof value === 'object'
      ? value
      : entitiesQuery.data?.find((entity) => entity.index === value);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(details) => setOpen(details.open)}
      positioning={{ placement: 'bottom-start', sameWidth: true }}
    >
      <Popover.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          w="full"
          justifyContent="space-between"
          disabled={disabled}
          aria-label={label}
        >
          <Text truncate>
            {selected
              ? `${selected.name || 'Entity'} #${selected.index}`
              : typeof value === 'number'
                ? `Entity #${value}`
                : label}
          </Text>
          <ChevronDown size={14} aria-hidden="true" />
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content maxW="sm">
            <Popover.Body p="2">
              <SearchableListbox
                key={open ? 'open' : 'closed'}
                items={entitiesQuery.data ?? []}
                value={selected}
                searchPlaceholder="Search entities..."
                getKey={(entity) => `${entity.index}:${entity.generation}`}
                getLabel={(entity) => entity.name || `Entity ${entity.index}`}
                filter={(entity, search) =>
                  entity.name.toLowerCase().includes(search) ||
                  String(entity.index).includes(search)
                }
                isLoading={entitiesQuery.isLoading}
                error={entitiesQuery.error ? 'Unable to load entities' : undefined}
                onChange={(entity) => {
                  if (entity) {
                    onChange(entity);
                    setOpen(false);
                  }
                }}
                renderItem={(entity) => (
                  <Text truncate>
                    {entity.name || 'Unnamed entity'}{' '}
                    <Text as="span" color="fg.muted">
                      #{entity.index}
                    </Text>
                  </Text>
                )}
              />
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
