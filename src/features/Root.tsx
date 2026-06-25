import { Flex, IconButton, Image, Status, VStack } from "@chakra-ui/react";
import { Pause, Play } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useToggle } from "../hooks/useToggle";
import { useInterval } from "../hooks/useInterval";
import { siecsClient } from "../client";

function PlayButton() {
  const [state, toggle] = useToggle();

  return (
    <IconButton variant={"ghost"} onClick={toggle}>
      {state ? <Play /> : <Pause />}
    </IconButton>
  );
}

function ConnectionStatus() {
  const [status, toggle] = useToggle(false);

  useInterval(
    async () => {
      if (status != (await siecsClient.health())) {
        toggle();
      }
    },
    1000,
    {
      immediate: true,
    },
  );

  return (
    <Status.Root mr={1} colorPalette={status ? "green" : "red"}>
      <Status.Indicator />
    </Status.Root>
  );
}

function Header() {
  return (
    <Flex justifyContent={"space-between"} w={"full"}>
      <Flex w={"full"} gap={4} alignItems={"center"}>
        <Image ml={3} src="/logo.png" minW={"30px"} h={"30px"} />
        <PlayButton />
      </Flex>
      <ConnectionStatus />
    </Flex>
  );
}

export default function Root() {
  return (
    <VStack p={4} alignItems={"flex-start"} h={"dvh"}>
      <Header />
      <Outlet />
    </VStack>
  );
}
