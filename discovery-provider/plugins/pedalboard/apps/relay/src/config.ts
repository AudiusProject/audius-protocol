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
  aao: AntiAbuseConfig;
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
  logger.info(`running on ${process.env.ENVIRONMENT} network`)
  return {
    environment: process.env.environment || "dev",
    rpcEndpoint: process.env.rpcEndpoint || "http://chain:8545",
    entityManagerContractAddress: entityManagerContractAddress(),
    entityManagerContractRegistryKey: "EntityManager",
    requiredConfirmations: parseInt(process.env.requiredConfirmations || "1"),
    serverHost: process.env.serverHost || "0.0.0.0",
    serverPort: parseInt(process.env.serverPort || "6001"),
    aao: newAntiAbuseConfig()
  };
};

export type AntiAbuseConfig = {
  antiAbuseOracleUrl: string,
  allowRules: Set<number>,
  blockRelayAbuseErrorCodes: Set<number>,
  blockNotificationsErrorCodes: Set<number>,
  blockEmailsErrorCodes: Set<number>
}

export const newAntiAbuseConfig = (): AntiAbuseConfig => {
  return {
    antiAbuseOracleUrl: process.env.antiAbuseOracle || "https://antiabuseoracle.audius.co",
    allowRules: new Set([14, 17]),
    blockRelayAbuseErrorCodes: new Set([0, 8, 10, 13, 15, 18]),
    blockNotificationsErrorCodes: new Set([7, 9]),
    blockEmailsErrorCodes: new Set([0, 1, 2, 3, 4, 8, 10, 13, 15])

  }
}
