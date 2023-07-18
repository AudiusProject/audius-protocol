import App from "basekit/src/app";
import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { healthCheck } from "./routes/health";
import { relayHandler } from "./routes/relay";
import {
  RelayRequest,
  RelayRequestType,
  RelayResponse,
  RelayResponseType,
} from "./types/relay";
import { SharedData } from ".";

export const webServer = async (app: App<SharedData>) => {
  const fastify = Fastify({
    logger: true,
  }).withTypeProvider<TypeBoxTypeProvider>();

  fastify.get(
    "/relay/health",
    async (req, rep) => await healthCheck(app, req, rep)
  );
  fastify.post<{ Body: RelayRequestType; Reply: RelayResponseType }>(
    "/relay",
    {
      schema: {
        body: RelayRequest,
        response: {
          200: RelayResponse,
        },
      },
    },
    async ({ body }, _rep) => await relayHandler(app, body)
  );

  try {
    const { config: { serverHost, serverPort } } = app.viewAppData()
    await fastify.listen({ port: serverPort, host: serverHost });
  } catch (err) {
    fastify.log.error("fastify server crashed", err);
  }
};
