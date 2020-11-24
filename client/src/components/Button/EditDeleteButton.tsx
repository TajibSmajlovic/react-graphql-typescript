import React from "react";
import NextLink from "next/link";
import { Flex, Link, IconButton } from "@chakra-ui/core";
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";

import { useMeQuery } from "../../generated/graphql";

interface EditDeletePostButtonsProps {
  id: number;
  creatorId: number;
  isDeleting?: boolean;
  onDelete?: () => void;
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({
  id,
  creatorId,
  isDeleting,
  onDelete,
}) => {
  const [{ data: meData }] = useMeQuery();

  if (meData?.me?.id !== creatorId) return null;

  return (
    <Flex>
      <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
        <IconButton
          as={Link}
          mr={4}
          aria-label="Edit Post"
          icon={<EditIcon />}
        />
      </NextLink>
      <IconButton
        aria-label="Delete Post"
        onClick={onDelete}
        colorScheme="red"
        icon={<DeleteIcon />}
        disabled={isDeleting}
      />
    </Flex>
  );
};
