import { Splitter } from '@chakra-ui/react';
import { CppEditor } from '../code/CppEditor';
import { WorldEditorPaneLeft } from './WorldEditorPaneLeft';
import { WorldEditorPaneRight } from './WorldEditorPaneRight';
import { Tabs } from '@chakra-ui/react/tabs';

export function WorldEditorPage() {
  return (
    <Splitter.Root
      panels={[{ id: 'a', minSize: 18 }, { id: 'b' }, { id: 'c', minSize: 15 }]}
      defaultSize={[15, 60, 25]}
      borderWidth="1px"
      minH="60"
      rounded={'md'}
    >
      <Splitter.Panel id="a" bg={'bg.panel'}>
        <WorldEditorPaneLeft />
      </Splitter.Panel>
      <Splitter.ResizeTrigger id="a:b" />
      <Splitter.Panel id="b">
        <Tabs.Root defaultValue="script" h="full" w="full" p={0} m={0}>
             <Tabs.List>
               <Tabs.Trigger value="script">
                 script
               </Tabs.Trigger>
               <Tabs.Trigger value="scene">
                 scene
               </Tabs.Trigger>
             </Tabs.List>
             <Tabs.Content p={0} m={0} h="full" w="full" value="script"><CppEditor /></Tabs.Content>
             <Tabs.Content value="scene"></Tabs.Content>
           </Tabs.Root>

      </Splitter.Panel>
      <Splitter.ResizeTrigger id="b:c" />

      <Splitter.Panel id="c">
        <WorldEditorPaneRight />
      </Splitter.Panel>
    </Splitter.Root>
  );
}
