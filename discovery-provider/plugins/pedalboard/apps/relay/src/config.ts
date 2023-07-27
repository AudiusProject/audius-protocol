import dotenv from "dotenv";
import {
  stagingConfig,
  productionConfig,
  developmentConfig,
} from "@audius/sdk";
import { logger } from "./logger";

export type Config = {
  environment: string;
  rpcEndpoint: string;
  acdcChainId: string;
  entityManagerContractAddress: string;
  entityManagerContractRegistryKey: string;
  requiredConfirmations: number;
  serverHost: string;
  serverPort: number;
};

export const readConfig = (): Config => {
  dotenv.config();
  const entityManagerContractAddress = (): string => {
    switch (process.env.ENVIRONMENT) {
      case "prod":
        return productionConfig.entityManagerContractAddress;
      case "stage":
        return stagingConfig.entityManagerContractAddress;
      default:
        return developmentConfig.entityManagerContractAddress;
    }
  };
  const environment = process.env.environment || "stage"
  logger.info(`running on ${environment} network`);
  return {
    environment,
    rpcEndpoint: process.env.rpcEndpoint || "https://poa-gateway.staging.audius.co/",
    acdcChainId: process.env.acdcChainId || "1056801",
    entityManagerContractAddress: entityManagerContractAddress(),
    entityManagerContractRegistryKey: "EntityManager",
    requiredConfirmations: parseInt(process.env.requiredConfirmations || "1"),
    serverHost: process.env.serverHost || "0.0.0.0",
    serverPort: parseInt(process.env.serverPort || "6001"),
  };
};
