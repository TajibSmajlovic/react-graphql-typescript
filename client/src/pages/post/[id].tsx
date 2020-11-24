import React from "react";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";

import { Heading, Box } from "@chakra-ui/core";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { Layout } from "../../components/Layout/Layout";
import { useDeletePostMutation, usePostQuery } from "../../generated/graphql";
import { EditDeletePostButtons } from "../../components/Button/EditDeleteButton";

const Post = ({}) => {
  const router = useRouter();
  const id =
    typeof router.query.id === "string" ? parseInt(router.query.id) : -1;
  const [{ data, error, fetching }] = usePostQuery({
    pause: id === -1,
    variables: { id },
  });
  const [{ fetching: isDeleting }, deletePost] = useDeletePostMutation();

  if (fetching)
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
          await deletePost({ id: data.getPost?.id as number });
          router.back();
        }}
      />
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
