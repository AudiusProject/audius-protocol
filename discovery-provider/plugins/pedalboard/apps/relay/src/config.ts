import dotenv from "dotenv"
import { stagingConfig, productionConfig, developmentConfig } from "@audius/sdk"
import { logger } from "./logger";

export type Config = {
  environment: string;
  rpcEndpoint: string;
  entityManagerContractAddress: string;
  entityManagerContractRegistryKey: string;
  requiredConfirmations: number;
  serverHost: string;
  serverPort: number;
};

export const readConfig = (): Config => {
  dotenv.config()
  const entityManagerContractAddress = (): string => {
    switch (process.env.ENVIRONMENT) {
      case "prod":
        return productionConfig.entityManagerContractAddress
      case "stage":
        return stagingConfig.entityManagerContractAddress
      default:
        return developmentConfig.entityManagerContractAddress
    }
  }
  logger.info(`running on ${process.env.ENVIRONMENT} env`)
  return {
    environment: process.env.environment || "dev",
    rpcEndpoint: process.env.rpcEndpoint || "http://chain:8545",
    entityManagerContractAddress: entityManagerContractAddress(),
    entityManagerContractRegistryKey: "EntityManager",
    requiredConfirmations: parseInt(process.env.requiredConfirmations || "1"),
    serverHost: process.env.serverHost || "0.0.0.0",
    serverPort: parseInt(process.env.serverPort || "6001")
  };
};
