import { FastifyReply } from "fastify";

export const errorResponseForbidden = (rep: FastifyReply) => {
  rep.code(403).send();
};

export const errorResponseBadRequest = (rep: FastifyReply) => {
  rep.code(400).send();
}

export const errorResponseInternalServerError = (rep: FastifyReply) => {
  rep.code(500).send();
}
