import path from "path";
import { MikroORM } from "@mikro-orm/core";

import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { isProduction } from "./utils/constants";

export default {
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  user: "postgres",
  password: "postgres",
  dbName: "lireddit",
  type: "postgresql",
  debug: !isProduction,
  entities: [Post, User],
} as Parameters<typeof MikroORM.init>[0];
