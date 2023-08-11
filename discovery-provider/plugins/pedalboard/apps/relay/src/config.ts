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
  aao: AntiAbuseConfig;
  rateLimitAllowList: string[];
  rateLimitBlockList: string[];
};

export const readConfig = (): Config => {
  const environment = process.env.environment || "local";
  logger.info(`running on ${environment} network`);
  dotenv.config({ path: `${environment}.env` });
  const entityManagerContractAddress = (): string => {
    switch (environment) {
      case "prod":
        return productionConfig.entityManagerContractAddress;
      case "stage":
        return stagingConfig.entityManagerContractAddress;
      default:
        return developmentConfig.entityManagerContractAddress;
    }
  };
  if (process.env.acdcChainId === undefined)
    throw new Error("acdcChainId not configured");
  return {
    environment,
    rpcEndpoint: process.env.rpcEndpoint || "http://chain:8545",
    acdcChainId: process.env.acdcChainId || "1056801",
    entityManagerContractAddress: entityManagerContractAddress(),
    entityManagerContractRegistryKey: "EntityManager",
    requiredConfirmations: parseInt(process.env.requiredConfirmations || "1"),
    serverHost: process.env.serverHost || "0.0.0.0",
    serverPort: parseInt(process.env.serverPort || "6001"),
    aao: newAntiAbuseConfig(),
    rateLimitAllowList: allowListPublicKeys(),
    rateLimitBlockList: blockListPublicKeys()
  };
};

export type AntiAbuseConfig = {
  antiAbuseOracleUrl: string;
  allowRules: Set<number>;
  blockRelayAbuseErrorCodes: Set<number>;
  blockNotificationsErrorCodes: Set<number>;
  blockEmailsErrorCodes: Set<number>;
};

export const newAntiAbuseConfig = (): AntiAbuseConfig => {
  if (process.env.antiAbuseOracle === undefined)
    throw new Error("antiAbuseOracle not defined");
  return {
    antiAbuseOracleUrl: process.env.antiAbuseOracle,
    allowRules: new Set([14, 17]),
    blockRelayAbuseErrorCodes: new Set([0, 8, 10, 13, 15, 18]),
    blockNotificationsErrorCodes: new Set([7, 9]),
    blockEmailsErrorCodes: new Set([0, 1, 2, 3, 4, 8, 10, 13, 15]),
  };
};

const allowListPublicKeys = (): string[] => {
  const allowlistPublicKeyFromRelay = process.env.allowlistPublicKeyFromRelay
  if (allowlistPublicKeyFromRelay === undefined) return []
  return allowlistPublicKeyFromRelay.split(",")
}

const blockListPublicKeys = (): string[] => {
  const blocklistPublicKeyFromRelay = process.env.blocklistPublicKeyFromRelay
  if (blocklistPublicKeyFromRelay === undefined) return []
  return blocklistPublicKeyFromRelay.split(",")
}

