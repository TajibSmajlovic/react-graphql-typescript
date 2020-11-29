import React from "react";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import { Box, Button } from "@chakra-ui/core";

import {
  usePostQuery,
  useUpdatePostMutation,
} from "../../../generated/graphql";
import { Layout } from "../../../components/Layout/Layout";
import { InputField } from "../../../components/Form/InputField";
import { useGetIntId } from "../../../utils/useGetIntId";
import { withApollo } from "../../../utils/withApollo";

const EditPost = ({}) => {
  const router = useRouter();
  const intId = useGetIntId();
  const { data, loading } = usePostQuery({
    skip: intId === -1,
    variables: {
      id: intId,
    },
  });
  const [updatePost] = useUpdatePostMutation();

  if (loading)
    return (
      <Layout>
        <div>loading...</div>
      </Layout>
    );

  if (!data?.getPost)
    return (
      <Layout>
        <Box>could not find post</Box>
      </Layout>
    );

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: data.getPost.title, text: data.getPost.text }}
        onSubmit={async (values) => {
          await updatePost({ variables: { id: intId, ...values } });
          router.back();
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="title" placeholder="title" label="Title" />
            <Box mt={4}>
              <InputField
                textarea
                name="text"
                placeholder="text..."
                label="Body"
              />
            </Box>
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              variantColor="teal"
            >
              update post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withApollo({ ssr: false })(EditPost);
