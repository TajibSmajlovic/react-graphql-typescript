import argon2 from "argon2";
import { v4 } from "uuid";
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
import { validateRegister } from "../utils/validation/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../utils/constants";
import { getConnection } from "typeorm";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  email: string;

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
  async me(@Ctx() { req }: MyContext): Promise<User | undefined> {
    if (req.session.userId) return await User.findOne(req.session.userId);

    return undefined;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options", () => UsernamePasswordInput)
    options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(
      options.username,
      options.email,
      options.password
    );

    if (errors.length) return { errors };

    const hashedPassword = await argon2.hash(options.password);

    let user: User;

    try {
      // User.create({}).save()

      const responseUser = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          email: options.email,
          password: hashedPassword,
        })
        .returning("*")
        .execute();

      user = responseUser.raw[0];
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
    @Arg("usernameOrEmail", () => String)
    usernameOrEmail: string,
    @Arg("password", () => String)
    password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );

    if (!user)
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "usernameOrEmail doesn't exist",
          },
        ],
      };

    const isPasswordValid = await argon2.verify(user.password, password);

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

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) => {
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          resolve(false);

          return;
        }

        resolve(true);
      });
    });
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email", () => String)
    email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });

    if (!user) return true;

    const token = v4();

    redis.set(
      `${FORGET_PASSWORD_PREFIX}${token}`,
      user.id,
      "ex",
      1000 * 60 * 10
    );

    sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );

    return false;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token", () => String) token: string,
    @Arg("newPassword", () => String) newPassword: string,
    @Ctx() { req, redis }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length < 6)
      return {
        errors: [
          { field: "newPassword", message: "length must be greater than 2" },
        ],
      };

    const userId = await redis.get(`${FORGET_PASSWORD_PREFIX}${token}`);

    if (!userId)
      return {
        errors: [{ field: "token", message: "token expired!" }],
      };

    const user = await User.findOne(parseInt(userId));

    if (!user)
      return {
        errors: [{ field: "newPassword", message: "User no longer exist" }],
      };

    await User.update(
      { id: parseInt(userId) },
      { password: await argon2.hash(newPassword) }
    );
    await redis.del(`${FORGET_PASSWORD_PREFIX}${token}`);

    req.session.userId = user.id;

    return { user };
  }
}
