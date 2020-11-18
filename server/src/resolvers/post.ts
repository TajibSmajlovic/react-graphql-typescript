import { getConnection } from "typeorm";
import {
  Resolver,
  Query,
  Arg,
  Int,
  Mutation,
  InputType,
  Field,
  Ctx,
  UseMiddleware,
  FieldResolver,
  Root,
  ObjectType,
} from "type-graphql";

import PaginatedResponse from "../utils/paginatedResponse";
import { Post } from "../entities/Post";
import { MyContext } from "./../utils/types";
import { isAuth } from "../middleware/isAuth";

// const sleep = (ms: number = 2000) => new Promise((res) => setTimeout(res, ms));

@InputType()
class PostInput {
  @Field()
  title: string;

  @Field()
  text: string;
}

@ObjectType()
class PaginatedPostsResponse extends PaginatedResponse(Post) {}

@Resolver(Post)
export class PostResolver {
  @Query(() => PaginatedPostsResponse)
  async getPosts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPostsResponse> {
    const realLimit = Math.min(50, limit) + 1;
    const realLimitPlusOne = realLimit + 1;
    const queryBuilder = getConnection()
      .getRepository(Post)
      .createQueryBuilder("p")
      .orderBy('"createdAt"', "DESC")
      .take(realLimitPlusOne);

    if (cursor)
      queryBuilder.where('"createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });

    const posts = await queryBuilder.getMany();

    return {
      items: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  getPost(@Arg("id", () => Int) id: number) {
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(@Arg("input") input: PostInput, @Ctx() { req }: MyContext) {
    return await Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ) {
    const post = await Post.findOne(id);

    if (!post) return null;

    if (typeof title !== "undefined") {
      await Post.update({ id }, { title });
    }

    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id") id: number) {
    try {
      await Post.delete(id);

      return true;
    } catch (error) {
      return false;
    }
  }

  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 100);
  }
}
