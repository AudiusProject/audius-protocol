import App from "basekit/src/app";
import { FastifyReply, FastifyRequest } from "fastify";
import { SharedData } from "..";

export const healthCheck = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  return { status: "up" };
};
