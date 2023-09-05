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
import { relayRateLimiter } from "./middleware/rateLimiter";
import { logRequest, logResponse } from "./logger";

export const webServer = async (app: App<SharedData>) => {
  const fastify = Fastify({
    logger: true,
    disableRequestLogging: true,
  }).withTypeProvider<TypeBoxTypeProvider>();

  fastify.get(
    "/relay/health",
    healthCheckConfig,
    async (req, rep) => await healthCheck(app, req, rep)
  );
  fastify.post<{ Body: RelayRequestType; Reply: RelayResponseType }>(
    "/relay",
    relayPostConfig,
    async (req, rep) =>
      await relayHandler(
        app,
        { reqIp: req.socket.remoteAddress! },
        req.body,
        rep
      )
  );

  try {
    const {
      config: { serverHost, serverPort },
    } = app.viewAppData();
    await fastify.listen({ port: serverPort, host: serverHost });
  } catch (err) {
    fastify.log.error(`fastify server crashed ${err}`);
  }
};

const loggingConfig = {
  onRequest: [logRequest],
  onResponse: [logResponse]
}

const healthCheckConfig = {
  ...loggingConfig
}

const relayPostConfig = {
  schema: {
    body: RelayRequest,
    response: {
      200: RelayResponse,
    },
  },
  // middlewares
  ...loggingConfig,
  preHandler: [relayRateLimiter],
};
