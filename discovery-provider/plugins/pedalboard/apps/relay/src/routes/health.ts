import App from "basekit/src/app";
import { FastifyReply, FastifyRequest } from "fastify";
import { SharedData } from "..";
import { Request, Response } from "express";

export const healthCheck = async (
  req: Request,
  res: Response
) => {
  res.send({ status: "up" });
};
