import dotenv from "dotenv";

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
  dotenv.config();
  return {
    environment: process.env.environment || "local",
    rpcEndpoint: process.env.rpcEndpoint || "http://localhost:8545",
    entityManagerContractAddress:
      process.env.entityManagerContractAddress || "",
    entityManagerContractRegistryKey:
      process.env.entityManagerContractRegistryKey || "EntityManager",
    requiredConfirmations: parseInt(process.env.requiredConfirmations || "1"),
    serverHost: process.env.serverHost || "0.0.0.0",
    serverPort: parseInt(process.env.serverPort || "5643")
  };
};
