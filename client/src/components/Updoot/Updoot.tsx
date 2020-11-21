import React, { useState } from "react";
import { Flex, IconButton } from "@chakra-ui/core";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

import { PostSnippetFragment, useVoteMutation } from "../../generated/graphql";

interface UpdootProps {
  post: PostSnippetFragment;
}

const Updoot: React.FC<UpdootProps> = ({ post }) => {
  const [loadingState, setLoadingState] = useState<
    "updoot-loading" | "downdoot-loading" | "not-loading"
  >("not-loading");
  const [, vote] = useVoteMutation();

  return (
    <Flex direction="column" justifyContent="center" alignItems="center" mr={4}>
      <IconButton
        onClick={async () => {
          setLoadingState("updoot-loading");
          await vote({
            postId: post.id,
            value: 1,
          });
          setLoadingState("not-loading");
        }}
        // variantColor={post.voteStatus === 1 ? "green" : undefined}
        isLoading={loadingState === "updoot-loading"}
        aria-label="updoot post"
        icon={<ChevronUpIcon />}
        disabled={post.votedValue === 1}
      />
      {post.points}
      <IconButton
        onClick={async () => {
          setLoadingState("downdoot-loading");
          await vote({
            postId: post.id,
            value: -1,
          });
          setLoadingState("not-loading");
        }}
        // variantColor={post.voteStatus === -1 ? "red" : undefined}
        isLoading={loadingState === "downdoot-loading"}
        aria-label="downdoot post"
        icon={<ChevronDownIcon />}
        disabled={post.votedValue === -1}
      />
    </Flex>
  );
};

export default Updoot;
