import argon2 from "argon2";
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
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    if (!options.username.length)
      return {
        errors: [
          {
            field: "username",
            message: "Username can't be empty",
          },
        ],
      };

    if (options.password.length <= 6)
      return {
        errors: [
          {
            field: "password",
            message: "Password must be at least 6 characters long",
          },
        ],
      };

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });

    try {
      await em.persistAndFlush(user);
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

    return { user };
  }

  @Query(() => UserResponse)
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
