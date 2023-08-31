import App from "basekit/src/app";
import { FastifyReply, FastifyRequest } from "fastify";

export const healthCheck = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  return { status: "up" };
};
