import React from "react";
import NextLink from "next/link";
import { Box, Link, Flex, Heading, Button } from "@chakra-ui/core";

import { useLogoutMutation, useMeQuery } from "../../generated/graphql";
import { isServer } from "../../utils/helpers";

export const NavBar: React.FC = () => {
  const [{ fetching: logoutLoading }, logout] = useLogoutMutation();
  const [{ data, fetching: loading }] = useMeQuery({ pause: isServer() });
  let body = null;

  // data is loading
  if (loading) {
  } else if (!data?.me) {
    // user not logged in
    body = (
      <>
        <NextLink href="/login">
          <Link mr={2}>login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link>register</Link>
        </NextLink>
      </>
    );
  } else {
    // user is logged in
    body = (
      <Flex>
        <Box mr={2}>{data.me.username}</Box>
        <Button
          variant="link"
          onClick={() => logout()}
          isLoading={logoutLoading}
          isDisabled={logoutLoading}
        >
          logout
        </Button>
      </Flex>
    );
  }

  return (
    <Flex zIndex={1} position="sticky" top={0} bg="tan" p={4}>
      <Flex flex={1} m="auto" align="center" maxW={800}>
        <NextLink href="/">
          <Link>
            <Heading>Heading</Heading>
          </Link>
        </NextLink>
        <Box ml={"auto"}>{body}</Box>
      </Flex>
    </Flex>
  );
};
