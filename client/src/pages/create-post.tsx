import React from "react";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";
import { Form, Formik } from "formik";
import { Box, Button } from "@chakra-ui/core";

import { InputField } from "../components/Form/InputField";
import { Layout } from "../components/Layout/Layout";
import { useCreatePostMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { useIsAuth } from "../utils/hooks/useIsAuth";

const CreatePost: React.FC = ({}) => {
  const [, createPost] = useCreatePostMutation();
  const router = useRouter();

  useIsAuth();

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values) => {
          const { error } = await createPost({ input: values });

          if (!error) router.push("/");
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
              create post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(CreatePost);
