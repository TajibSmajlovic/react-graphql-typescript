import { ApolloClient, InMemoryCache } from "@apollo/client";
import { NextPageContext } from "next";

import { PaginatedPostsResponse } from "../generated/graphql";
import { createWithApollo } from "./createWithApollo.js";

const createClient = (ctx: NextPageContext) =>
  new ApolloClient({
    uri: "http://localhost:5000/graphql",
    credentials: "include",
    headers: {
      cookie:
        (typeof window === "undefined"
          ? ctx?.req?.headers.cookie
          : undefined) || "",
    },
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            getPosts: {
              keyArgs: [],
              merge(
                existing: PaginatedPostsResponse | undefined,
                incoming: PaginatedPostsResponse
              ): PaginatedPostsResponse {
                return {
                  ...incoming,
                  items: [...(existing?.items || []), ...incoming.items],
                };
              },
            },
          },
        },
      },
    }),
  });

export const withApollo = createWithApollo(createClient);
