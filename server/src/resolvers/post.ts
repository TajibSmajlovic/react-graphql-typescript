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
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";
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
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext // , @Info() info: any
  ): Promise<PaginatedPostsResponse> {
    const loggedInUserId = req.session.userId;
    const realLimit = Math.min(50, limit) + 1;
    const realLimitPlusOne = realLimit + 1;
    // const queryBuilder = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("post")
    //   .innerJoinAndSelect("post.creator", "user", 'user.id = post."creatorId"')
    //   .orderBy('post."createdAt"', "DESC")
    //   .take(realLimitPlusOne);

    // if (cursor)
    //   queryBuilder.where('post."createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor)),
    //   });

    // const posts = await queryBuilder.getMany();

    const replacements: any[] = [realLimitPlusOne];
    if (cursor) replacements.push(new Date(parseInt(cursor)));

    const posts: Post[] = await getConnection().query(
      `
        select p.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'email', u.email
        ) creator
        from post p
        inner join public.user u on u.id = p."creatorId"
        ${cursor ? `where p."createdAt" < $2` : ""}
        order by p."createdAt" DESC
        limit $1
      `,
      replacements
    );

    const votes: Updoot[] = [];
    const fetchedPostIds = posts.map((p) => p.id);
    if (loggedInUserId) {
      const updoots: Updoot[] = await getConnection().query(
        `
          select u.* from updoot u
          where u."userId" = $1 and
          u."postId" in (${fetchedPostIds})
   `,
        [loggedInUserId]
      );

      if (updoots.length) votes.push(...updoots);
    }

    if (votes.length)
      posts.forEach((p) => {
        const postVotes = votes.filter((v) => v.postId === p.id);
        if (postVotes.length) p.updoots = postVotes;
      });

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
    try {
      const createdPost = await Post.create({
        ...input,
        creatorId: req.session.userId,
      }).save();

      const user = await User.findOne(req.session.userId);

      if (user) createdPost.creator = user;

      return createdPost;
    } catch (error) {
      return null;
    }
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

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // the user has voted on the post before
    // and they are changing their vote
    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
            update updoot
            set value = $1
            where "postId" = $2 and "userId" = $3
        `,
          [realValue, postId, userId]
        );

        await tm.query(
          `
            update post
            set points = points + $1
            where id = $2
        `,
          [2 * realValue, postId]
        );
      });
    } else if (!updoot) {
      // has never voted before
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
            insert into updoot ("userId", "postId", value)
            values ($1, $2, $3)
        `,
          [userId, postId, realValue]
        );

        await tm.query(
          `
            update post
            set points = points + $1
            where id = $2
      `,
          [realValue, postId]
        );
      });
    }

    return true;
  }

  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 100);
  }

  @FieldResolver(() => Int, { nullable: true })
  async votedValue(@Root() root: Post) {
    return root.updoots ? root.updoots[0].value : null;
  }
}
