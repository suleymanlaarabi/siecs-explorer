import { Flex, IconButton, Image, Status, VStack } from "@chakra-ui/react";
import { Pause, Play } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useToggle } from "../hooks/useToggle";

function PlayButton() {
  const [state, toggle] = useToggle();

  return (
    <IconButton variant={"ghost"} onClick={toggle}>
      {state ? <Play /> : <Pause />}
    </IconButton>
  );
}

function Header() {
  return (
    <Flex justifyContent={"space-between"} w={"full"}>
      <Flex w={"full"} gap={4} alignItems={"center"}>
        <Image ml={3} src="/logo.png" minW={"30px"} h={"30px"} />
        <PlayButton />
      </Flex>
      <Status.Root colorPalette={"green"}>
        <Status.Indicator />
      </Status.Root>
    </Flex>
  );
}

export default function Root() {
  return (
    <VStack p={4} alignItems={"flex-start"}>
      <Header />
      <Outlet />
    </VStack>
  );
}
