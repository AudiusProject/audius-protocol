import { Request, Response, NextFunction } from 'express';
import { Table, Users } from "storage/src"
import { discoveryDb } from '..';

/** Context built by the context injector that can be referenced later in the request (via response object). */
export interface RequestContext {
    startTime: Date,
    recoveredSigner: Users,
    ip: string,
    requestId: string,
}

declare global {
    namespace Express {
      interface Locals {
        ctx: RequestContext
      }
    }
}

/** 
 * Uses the req.locals object to inject common request objects for use in later middlewares
 * https://expressjs.com/en/api.html#res.locals
 */
export const contextInjectorMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = new Date(new Date().getTime())

    // TODO: pull these from validator?
    const senderAddress = ""
    const ip = ""
    const requestId = ""

    const maybeUser = await discoveryDb<Users>(Table.Users)
        .where("wallet", "=", senderAddress)
        .andWhere("is_current", "=", true)
        .first();

    // TODO: use error handling
    const recoveredSigner = maybeUser!

    // inject into response context
    res.locals.ctx = { startTime, recoveredSigner, ip, requestId }

    // move to next middleware
    next();
  }

