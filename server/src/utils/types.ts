import { Redis } from "ioRedis";
import { Session } from "express-session";
import { Request, Response } from "express";

import { createUserLoader } from "./createUserLoader";
import { createUpdootLoader } from "./createUpdootLoader";

export type MyContext = {
  req: Request & { session: Session & { userId?: number } };
  res: Response;
  redis: Redis;
  userLoader: ReturnType<typeof createUserLoader>;
  updootLoader: ReturnType<typeof createUpdootLoader>;
};
