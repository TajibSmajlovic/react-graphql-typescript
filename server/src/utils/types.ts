import { Redis } from "ioRedis";
import { Session } from "express-session";
import { Request, Response } from "express";

export type MyContext = {
  req: Request & { session: Session & { userId?: number } };
  res: Response;
  redis: Redis;
};
