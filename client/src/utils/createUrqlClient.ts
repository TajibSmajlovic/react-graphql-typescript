import { UpdatePostMutationVariables } from "./../generated/graphql";
import Router from "next/router";
import gql from "graphql-tag";
import { pipe, tap } from "wonka";
import {
  dedupExchange,
  Exchange,
  fetchExchange,
  stringifyVariables,
} from "urql";
import {
  cacheExchange,
  Cache,
  QueryInput,
  Resolver,
} from "@urql/exchange-graphcache";

import { isServer } from "./helpers";
import {
  DeletePostMutationVariables,
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
  VoteMutationVariables,
} from "../generated/graphql";

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie: string = "";
  if (isServer()) cookie = ctx?.req?.headers?.cookie;

  return {
    url: "http://localhost:5000/graphql",
    fetchOptions: {
      credentials: "include" as const,
      headers: cookie
        ? {
            cookie,
          }
        : undefined,
    },
    exchanges: [
      dedupExchange,
      cacheExchange({
        keys: {
          PaginatedPostsResponse: () => null,
        },
        resolvers: {
          Query: {
            getPosts: cursorPagination(),
          },
        },
        updates: {
          Mutation: {
            login: (_result, _1, cache, _2) => {
              updateQuery<LoginMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.login.errors) {
                    return query;
                  } else return { me: result.login.user };
                }
              );
              // invalidateAllPosts(cache)
            },
            register: (_result, _1, cache, _2) => {
              updateQuery<RegisterMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    return query;
                  } else return { me: result.register.user };
                }
              );
            },
            logout: (_result, _1, cache, _2) => {
              updateQuery<LogoutMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                () => ({ me: null })
              );
            },
            createPost: (_result, _1, cache, _2) => {
              invalidateAllPosts(cache);
            },
            updatePost: (_result, args, cache, _2) => {
              cache.invalidate({
                __typename: "Post",
                id: (args as UpdatePostMutationVariables).id,
              });
            },
            vote: (_result, args, cache, _2) => {
              // const allFields = cache.inspectFields("Query");
              // const fieldInfos = allFields.filter(
              //   (info) => info.fieldName === "getPosts"
              // );

              // fieldInfos.forEach((fieldInfo) => {
              //   cache.invalidate("Query", "getPosts", fieldInfo.arguments || {});
              // });

              const { postId, value } = args as VoteMutationVariables;
              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    id
                    points
                    voteStatus
                  }
                `,
                { id: postId } as any
              );

              if (data) {
                if (data.voteStatus === value) return;

                const newPoints =
                  (data.points as number) + (!data.voteStatus ? 1 : 2) * value;

                cache.writeFragment(
                  gql`
                    fragment __ on Post {
                      points
                      voteStatus
                    }
                  `,
                  { id: postId, points: newPoints, voteStatus: value } as any
                );
              }
            },
            deletePost: (_result, args, cache, _2) => {
              cache.invalidate({
                __typename: "Post",
                id: (args as DeletePostMutationVariables).id,
              });
            },
          },
        },
      }),
      errorExchange,
      ssrExchange,
      fetchExchange,
    ],
  };
};

function invalidateAllPosts(cache: Cache) {
  const allFields = cache.inspectFields("Query");
  const fieldInfos = allFields.filter((info) => info.fieldName === "getPosts");

  fieldInfos.forEach((fieldInfo) => {
    cache.invalidate("Query", "getPosts", fieldInfo.arguments || {});
  });
}

function updateQuery<Result, Query>(
  cache: Cache,
  qi: QueryInput,
  result: any,
  fn: (r: Result, q: Query) => Query
) {
  return cache.updateQuery(qi, (data) => fn(result, data as any) as any);
}

const errorExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      if (error?.message.includes("Not authenticated"))
        Router.replace("/login");
    })
  );
};

const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isItInTheCache = cache.resolve(
      cache.resolveFieldByKey(entityKey, fieldKey) as string,
      "posts"
    );

    info.partial = !isItInTheCache;

    let hasMore = true;
    const results: string[] = [];
    fieldInfos.forEach((fi) => {
      const key = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, "items") as string[];
      const _hasMore = cache.resolve(key, "hasMore");

      if (!_hasMore) {
        hasMore = _hasMore as boolean;
      }

      results.push(...data);
    });

    return {
      __typename: "PaginatedPostsResponse",
      hasMore,
      items: results,
    };
  };
};
