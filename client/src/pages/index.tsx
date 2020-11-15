import React from "react";
import { Spinner } from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";

import { NavBar } from "../components/Layout/NavBar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  const [{ data, fetching }] = usePostsQuery();

  return (
    <>
      <NavBar />
      <div>Hello World!</div>
      {fetching && <Spinner />}
      <br />
      {data && data.getPosts.map((p) => <div key={p.id}>{p.title}</div>)}
    </>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
