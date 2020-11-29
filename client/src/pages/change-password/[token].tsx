import React, { useState } from "react";
import NextLink from "next/link";
import { NextPage } from "next";
import { Box, Button, Flex, Link } from "@chakra-ui/core";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";

import { Wrapper } from "../../components/Layout/Wrapper";
import { InputField } from "../../components/Form/InputField";
import {
  MeDocument,
  MeQuery,
  useChangePasswordMutation,
} from "../../generated/graphql";
import { toErrorMap } from "../../utils/toErrorMap";
import { withApollo } from "../../utils/withApollo";

const ChangePassword: NextPage = () => {
  const [changePassword] = useChangePasswordMutation();
  const [tokenError, setTokenError] = useState("");
  const router = useRouter();

  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ newPassword: "" }}
        onSubmit={async (values, { setErrors }) => {
          const response = await changePassword({
            variables: {
              token:
                typeof router.query.token === "string"
                  ? router.query.token
                  : "",
              newPassword: values.newPassword,
            },
            update: (cache, { data }) => {
              cache.writeQuery<MeQuery>({
                query: MeDocument,
                data: {
                  __typename: "Query",
                  me: data?.changePassword.user,
                },
              });
              cache.evict({ fieldName: "getPosts" });
            },
          });

          if (response.data?.changePassword.errors) {
            const errorMap = toErrorMap(response.data.changePassword.errors);

            if ("token" in errorMap) setTokenError(errorMap.token);

            setErrors(errorMap);
          } else if (response.data?.changePassword.user) router.push("/");
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="newPassword"
              placeholder="new password"
              label="New Password"
              type="password"
            />
            {tokenError ? (
              <Flex>
                <Box mr={2} style={{ color: "red" }}>
                  {tokenError}
                </Box>
                <NextLink href="/forgot-password">
                  <Link>click here to get a new one</Link>
                </NextLink>
              </Flex>
            ) : null}
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              variantColor="teal"
            >
              change password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

// ChangePassword.getInitialProps = ({ query }) => {
//   return { token: query.token as string };
// };

export default withApollo({ ssr: false })(ChangePassword);
