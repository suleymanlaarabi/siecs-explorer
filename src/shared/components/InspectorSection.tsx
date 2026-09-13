import { EmptyState, Heading, HStack, VStack } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export function InspectorSection({
  title,
  action,
  empty,
  emptyText,
  children,
}: {
  title: string;
  action: ReactNode;
  empty: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <VStack align="stretch" gap="2">
      <HStack justify="space-between" minH="7">
        <Heading size="sm">{title}</Heading>
        {action}
      </HStack>
      {empty ? (
        <EmptyState.Root size="sm" py="4">
          <EmptyState.Content>
            <EmptyState.Title color="fg.muted" textStyle="sm">
              {emptyText}
            </EmptyState.Title>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        children
      )}
    </VStack>
  );
}
