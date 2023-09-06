import { NextFunction, Request, Response } from "express";

export const healthCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.send({ status: "up" });
  next();
};
