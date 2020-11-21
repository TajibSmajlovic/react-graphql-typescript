import React, { useState } from "react";
import NextLink from "next/link";
import { Box, Button, Flex, Heading, Link, Stack, Text } from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";

import Updoot from "../components/Updoot/Updoot";
import { Layout } from "../components/Layout/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as null | string,
  });
  const [{ data, fetching }] = usePostsQuery({ variables });

  if (!fetching && !data) return <div>No posts!</div>;

  return (
    <Layout>
      <Flex align="center">
        <Heading>LiReddit</Heading>

        <NextLink href="/create-post">
          <Link ml="auto">Create post</Link>
        </NextLink>
      </Flex>

      <br />

      <Stack spacing={8}>
        {fetching && !data
          ? "Loading..."
          : data!.getPosts.items.map((p) =>
              !p ? null : (
                <Flex key={p.id} p={5} shadow="md" borderWidth="1px">
                  <Updoot post={p} />
                  <Box flex={1}>
                    <NextLink href="/post/[id]" as={`/post/${p.id}`}>
                      <Link>
                        <Heading fontSize="xl">{p.title}</Heading>
                      </Link>
                    </NextLink>
                    <Text>
                      posted by <b>{p.creator.username}</b>
                    </Text>
                    <Flex align="center">
                      <Text flex={1} mt={4}>
                        {p.textSnippet}
                      </Text>
                    </Flex>
                  </Box>
                </Flex>
              )
            )}
      </Stack>

      {data && data.getPosts.hasMore && (
        <Flex>
          <Button
            m="auto"
            my={8}
            isLoading={fetching}
            onClick={() =>
              setVariables({
                limit: variables.limit,
                cursor:
                  data.getPosts.items[data.getPosts.items.length - 1].createdAt,
              })
            }
          >
            Load more
          </Button>
        </Flex>
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
