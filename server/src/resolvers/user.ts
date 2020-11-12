import argon2 from "argon2";
import { EntityManager } from "@mikro-orm/postgresql";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";

import { User } from "./../entities/User";
import { MyContext } from "./../utils/types";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field(() => String, { nullable: true })
  field?: string;

  @Field(() => String)
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext): Promise<User | null> {
    if (req.session.userId) {
      const user = await em.findOne(User, { id: req.session.userId });

      return user;
    }

    return null;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options", () => UsernamePasswordInput)
    options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const errors: FieldError[] = [];

    if (!options.username.length)
      errors.push({
        field: "username",
        message: "Username can't be empty",
      });

    if (options.password.length <= 6) {
      errors.push({
        field: "password",
        message: "Password must be at least 6 characters long",
      });

      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);
    // const user = em.create(User, {
    //   username: options.username,
    //   password: hashedPassword,
    // });

    let user: User;

    try {
      const [responseUser] = await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username: options.username,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*");
      user = responseUser;

      // await em.persistAndFlush(user);
    } catch (error) {
      if (error.code === "23505")
        return {
          errors: [
            {
              field: "username",
              message: "Username already taken",
            },
          ],
        };
      else
        return {
          errors: [
            {
              message: "Internal Server Error",
            },
          ],
        };
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options", () => UsernamePasswordInput)
    options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });

    if (!user)
      return {
        errors: [
          {
            field: "username",
            message: "Username doesn't exist",
          },
        ],
      };

    const isPasswordValid = await argon2.verify(
      user.password,
      options.password
    );

    if (!isPasswordValid)
      return {
        errors: [
          {
            field: "password",
            message: "Wrong password",
          },
        ],
      };

    req.session.userId = user.id;

    return {
      user,
    };
  }
}
