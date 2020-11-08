import { Resolver, Query, Ctx, Arg, Int, Mutation } from "type-graphql";

import { Post } from "../entities/Post";
import { MyContext } from "./../utils/types";

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  getPosts(@Ctx() { em }: MyContext): Promise<Post[]> {
    return em.find(Post, {});
  }

  @Query(() => Post, { nullable: true })
  getPost(@Arg("id", () => Int) id: number, @Ctx() { em }: MyContext) {
    return em.findOne(Post, { id });
  }

  @Mutation(() => Post)
  async createPost(
    @Arg("title", () => String) title: string,
    @Ctx() { em }: MyContext
  ) {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);

    return post;
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Ctx() { em }: MyContext
  ) {
    const post = await em.findOne(Post, { id });

    if (!post) return null;

    if (typeof title !== "undefined") {
      post.title = title;
      await em.persistAndFlush(post);
    }

    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id") id: number, @Ctx() { em }: MyContext) {
    try {
      await em.nativeDelete(Post, { id });

      return true;
    } catch (error) {
      return false;
    }
  }
}
