import React from "react";
import NextLink from "next/link";
import { Box, Button, Flex, Heading, Link, Stack, Text } from "@chakra-ui/core";

import Updoot from "../components/Updoot/Updoot";
import { Layout } from "../components/Layout/Layout";
import { EditDeletePostButtons } from "../components/Button/EditDeleteButton";
import { useDeletePostMutation, usePostsQuery } from "../generated/graphql";
import { withApollo } from "../utils/withApollo";

const Index = () => {
  const { data, loading, fetchMore, variables } = usePostsQuery({
    variables: {
      limit: 10,
      cursor: null,
    },
    notifyOnNetworkStatusChange: true,
  });
  const [deletePost] = useDeletePostMutation();

  // if (loading) return <div>Loading...</div>;

  if (!loading && !data) return <div>No posts!</div>;

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
        {loading && !data
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
                    <Flex>
                      <Box>
                        <Text>
                          posted by <b>{p.creator.username}</b>
                        </Text>
                        <Flex align="center">
                          <Text flex={1} mt={4}>
                            {p.textSnippet}
                          </Text>
                        </Flex>
                      </Box>
                      <Box ml="auto">
                        <EditDeletePostButtons
                          id={p.id}
                          creatorId={p.creator.id}
                          onDelete={() => {
                            deletePost({
                              variables: { id: p.id },
                              update: (cache) => {
                                cache.evict({ id: `Post:${p.id}` });
                              },
                            });
                          }}
                        />
                      </Box>
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
            isLoading={loading}
            onClick={() =>
              fetchMore({
                variables: {
                  limit: variables!.limit,
                  cursor:
                    data.getPosts.items[data.getPosts.items.length - 1]
                      .createdAt,
                },
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

export default withApollo({ ssr: true })(Index);
