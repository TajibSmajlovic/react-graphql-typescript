import { Redis } from "ioRedis";
import { Session } from "express-session";
import { Request, Response } from "express";
import { Connection, EntityManager, IDatabaseDriver } from "@mikro-orm/core";

export type MyContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
  req: Request & { session: Session & { userId?: number } };
  res: Response;
  redis: Redis;
};
