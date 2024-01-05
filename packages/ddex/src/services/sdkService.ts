import type {
  AudiusSdk as AudiusSdkType,
  ServicesConfig,
} from "@audius/sdk/dist/sdk/index.d.ts";
import {
  AppAuth,
  DiscoveryNodeSelector,
  EntityManager,
  Logger,
  StorageNodeSelector,
  developmentConfig,
  stagingConfig,
  productionConfig,
  sdk,
} from "@audius/sdk";

export const createSdkService = () => {
  let sdkInstance: AudiusSdkType | null = null;

  const ddexKey = process.env.DDEX_KEY;
  const ddexSecret = process.env.DDEX_SECRET;
  const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'dev'
  if (ddexKey && ddexSecret) {
    try {
      const logger = new Logger({ logLevel: "info" });

      // Determine config to use
      let config = developmentConfig as ServicesConfig;
      let initialSelectedNode = "http://audius-protocol-discovery-provider-1";
      if (env === "production") {
        config = productionConfig as ServicesConfig;
        initialSelectedNode = "https://discoveryprovider.audius.co";
      } else if (env === "stage") {
        config = stagingConfig as ServicesConfig;
        initialSelectedNode = "https://discoveryprovider.staging.audius.co";
      }

      // Init SDK
      const discoveryNodeSelector = new DiscoveryNodeSelector({
        initialSelectedNode,
      });
      const storageNodeSelector = new StorageNodeSelector({
        auth: new AppAuth(ddexKey, ddexSecret),
        discoveryNodeSelector: discoveryNodeSelector,
        bootstrapNodes: config.storageNodes,
        logger,
      });
      sdkInstance = sdk({
        services: {
          discoveryNodeSelector,
          entityManager: new EntityManager({
            discoveryNodeSelector,
            web3ProviderUrl: config.web3ProviderUrl,
            contractAddress: config.entityManagerContractAddress,
            identityServiceUrl: config.identityServiceUrl,
            useDiscoveryRelay: true,
            logger,
          }),
          storageNodeSelector,
          logger,
        },
        apiKey: ddexKey,
        apiSecret: ddexSecret,
        appName: "DDEX Demo",
      });
      console.log(`SDK initialized for ${env}`);
    } catch (error) {
      console.error(`SDK failed for initialize for ${env}:`, error);
    }
  } else {
    console.log("DDEX keys not configured. Skipping SDK initialization");
  }

  const getSdk = () => {
    if (!sdkInstance) {
      throw new Error("SDK not initialized");
    }
    return sdkInstance;
  };

  return {
    getSdk,
  };
};
