import React from "react";
import NextLink from "next/link";
import { Box, Link, Flex, Heading } from "@chakra-ui/core";

import { useMeQuery } from "../../generated/graphql";

export const NavBar: React.FC = ({}) => {
  const [{ data, fetching: loading }] = useMeQuery();

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
    body = <Box>{data.me.username}</Box>;
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
