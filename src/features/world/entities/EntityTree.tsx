import { Button, TreeView, createTreeCollection } from '@chakra-ui/react';
import { Box, ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import type { EntityNode } from './entityTreeModel';
import { useEntityTree } from './useEntityTree';

export function EntityTree() {
  const tree = useEntityTree();
  const collection = useMemo(
    () =>
      createTreeCollection<EntityNode>({
        rootNode: {
          id: 'root',
          name: 'root',
          index: -1,
          generation: 0,
          hasChildren: true,
          children: tree.nodes,
        },
        nodeToValue: (node) => node.id,
        nodeToString: (node) => node.name,
        nodeToChildren: (node) => node.children ?? [],
      }),
    [tree.nodes],
  );

  return (
    <TreeView.Root
      collection={collection}
      rounded="none"
      height="100%"
      overflowY="auto"
      bg="bg.panel"
      p={1}
      lazyMount
      expandedValue={tree.expandedIds}
      selectedValue={tree.selectedId ? [tree.selectedId] : []}
      onExpandedChange={(details) => tree.expand(details.expandedValue)}
      onSelectionChange={(details) => tree.select(details.selectedValue[0])}
    >
      <TreeView.Tree gap={1}>
        <TreeView.Node
          indentGuide={<TreeView.BranchIndentGuide />}
          render={({ node, nodeState }) =>
            node.hasChildren ? (
              <TreeView.BranchControl
                my={1}
                px={3}
                rounded="xs"
                _hover={{ bg: 'bg.emphasized/60' }}
                _selected={{ bg: 'bg.muted' }}
              >
                {nodeState.expanded ? <ChevronDown /> : <ChevronRight />}
                <TreeView.BranchText fontSize="md">{node.name}</TreeView.BranchText>
              </TreeView.BranchControl>
            ) : (
              <TreeView.Item
                rounded="xs"
                _hover={{ bg: 'bg.emphasized/60' }}
                _selected={{ bg: 'bg.muted' }}
              >
                <Box />
                <TreeView.ItemText fontSize="md">{node.name}</TreeView.ItemText>
              </TreeView.Item>
            )
          }
        />
      </TreeView.Tree>
      <Button variant="outline" mx={1} loading={tree.isCreating} onClick={tree.createEntity}>
        New entity
      </Button>
    </TreeView.Root>
  );
}
