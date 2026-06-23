import { Flex, Image } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";

function Header() {
  return (
    <Flex p={4}>
      <Image src="/logo.png" minW={"30px"} h={"30px"} />
    </Flex>
  );
}

export default function Root() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}
