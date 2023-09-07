import dotenv from "dotenv";
import { logger } from "../logger";
import { bool, cleanEnv, num, str } from "envalid";
import {
  AntiAbuseConfig,
  allowListPublicKeys,
  blockListPublicKeys,
  newAntiAbuseConfig,
} from "./antiAbuseConfig";

export type Config = {
  environment: string;
  rpcEndpoint: string;
  rpcEndpointFallback: string;
  acdcChainId?: string;
  discoveryDbConnectionString: string;
  entityManagerContractAddress: string;
  entityManagerContractRegistryKey: string;
  serverHost: string;
  serverPort: number;
  aao: AntiAbuseConfig;
  rateLimitAllowList: string[];
  rateLimitBlockList: string[];
};

// reads .env file based on environment
const readDotEnv = () => {
  const environment = process.env.audius_discprov_env || "dev";
  const dotenvConfig = (filename: string) =>
    dotenv.config({ path: `${filename}.env` });
  logger.info(`running on ${environment} network`);
  dotenvConfig(environment);
};

export const readConfig = (): Config => {
  readDotEnv();

  // validate env
  const env = cleanEnv(process.env, {
    audius_discprov_env: str(),
    audius_contracts_entity_manager_address: str(),
    audius_web3_localhost: str(),
    audius_web3_host: str(),
    audius_db_url: str(),
    audius_aao_endpoint: str(),
    audius_use_aao: bool(),
    relay_server_host: str({ default: "0.0.0.0" }),
    relay_server_port: num({ default: 6001 }),
  });
  return {
    environment: env.audius_discprov_env,
    rpcEndpoint: env.audius_web3_localhost,
    rpcEndpointFallback: env.audius_web3_host,
    discoveryDbConnectionString: env.audius_db_url,
    entityManagerContractAddress: env.audius_contracts_entity_manager_address,
    entityManagerContractRegistryKey: "EntityManager",
    serverHost: env.relay_server_host,
    serverPort: env.relay_server_port,
    aao: newAntiAbuseConfig(env.audius_aao_endpoint, env.audius_use_aao),
    rateLimitAllowList: allowListPublicKeys(),
    rateLimitBlockList: blockListPublicKeys(),
  };
};
