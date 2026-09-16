import { Heading, HStack, VStack } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export function InspectorSection({
  title,
  action,
  children,
}: {
  title: string;
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <VStack align="stretch" gap="2">
      <HStack justify="space-between" minH="7">
        <Heading size="sm">{title}</Heading>
        {action}
      </HStack>
      {children}
    </VStack>
  );
}
