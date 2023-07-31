import { FastifyReply } from "fastify";

export const errorResponseForbidden = (rep: FastifyReply) => {
    rep.code(403).send();
  };
