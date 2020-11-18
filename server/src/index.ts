import "reflect-metadata";
import Redis from "ioRedis";
import express from "express";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import path from "path";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";

import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { COOKIE_NAME, isProduction } from "./utils/constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";

const main = async () => {
  const connection = await createConnection({
    type: "postgres",
    database: "lireddit",
    username: "postgres",
    password: "postgres",
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [Post, User],
  });

  // await Post.delete({});

  connection.runMigrations();
  console.log(connection);

  const app = express();
  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 2, // 2 minutes
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction, // cookie only works in https
      },
      secret: "dsa251dasd2dsa",
      saveUninitialized: false,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res, redis }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
    // cors: { origin: "http://localhost:3000" },
  });

  app.listen(5000, () => console.log("Server started!"));
};

main().catch((err) => console.log(err));
