import { Flex, IconButton, Image, Status, VStack } from '@chakra-ui/react';
import { Pause, Play } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useToggle } from '../hooks/useToggle';
import { useHealthQuery } from './world/api/healthQueries';
import { SceneActions } from './world/SceneActions';
import { CppHeadersDialog } from './code/CppHeadersDialog';

function PlayButton() {
  const [state, toggle] = useToggle();

  return (
    <IconButton variant={'ghost'} onClick={toggle}>
      {state ? <Play /> : <Pause />}
    </IconButton>
  );
}

function ConnectionStatus() {
  const { data: connected = false } = useHealthQuery();

  return (
    <Status.Root mr={1} colorPalette={connected ? 'green' : 'red'}>
      <Status.Indicator />
    </Status.Root>
  );
}

function Header() {
  return (
    <Flex justifyContent={'space-between'} w={'full'}>
      <Flex gap={4} alignItems={'center'}>
        <Image ml={3} src="/logo.png" minW={'30px'} h={'30px'} />
        <PlayButton />
      </Flex>
      <Flex justifyContent="center">
        <SceneActions />
      </Flex>
      <Flex alignItems="center" gap="2">
        <CppHeadersDialog />
        <ConnectionStatus />
      </Flex>
    </Flex>
  );
}

export default function Root() {
  return (
    <VStack p={4} alignItems={'flex-start'} h={'dvh'}>
      <Header />
      <Outlet />
    </VStack>
  );
}
