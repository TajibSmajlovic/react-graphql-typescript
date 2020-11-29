import React from "react";
import { useRouter } from "next/router";

import { Heading, Box } from "@chakra-ui/core";
import { Layout } from "../../components/Layout/Layout";
import { useDeletePostMutation, usePostQuery } from "../../generated/graphql";
import { EditDeletePostButtons } from "../../components/Button/EditDeleteButton";
import { withApollo } from "../../utils/withApollo";

const Post = ({}) => {
  const router = useRouter();
  const id =
    typeof router.query.id === "string" ? parseInt(router.query.id) : -1;
  const { data, error, loading } = usePostQuery({
    skip: id === -1,
    variables: { id },
  });
  const [deletePost, { loading: isDeleting }] = useDeletePostMutation();

  if (loading)
    return (
      <Layout>
        <div>loading...</div>
      </Layout>
    );

  if (error) return <div>{error.message}</div>;

  if (!data?.getPost)
    return (
      <Layout>
        <Box>could not find post</Box>
      </Layout>
    );

  return (
    <Layout>
      <Heading mb={4}>{data.getPost.title}</Heading>
      <Box mb={4}>{data.getPost.text}</Box>
      <EditDeletePostButtons
        id={data.getPost.id}
        creatorId={data.getPost.creator.id}
        isDeleting={isDeleting}
        onDelete={async () => {
          await deletePost({
            variables: { id: data.getPost?.id as number },
            update: (cache) => {
              cache.evict({ id: `Post:${p.id}` });
            },
          });
          router.back();
        }}
      />
    </Layout>
  );
};

export default withApollo({ ssr: true })(Post);
