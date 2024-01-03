import type {
  AudiusSdk as AudiusSdkType,
  ServicesConfig,
} from "@audius/sdk/dist/sdk/index.d.ts";
import { useAudiusLibs } from "../providers/AudiusLibsProvider";
import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { useEnvVars } from "../providers/EnvVarsProvider";
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

type AudiusSdkContextType = {
  audiusSdk: AudiusSdkType | null;
  isLoading: boolean;
};

const AudiusSdkContext = createContext<AudiusSdkContextType>({
  audiusSdk: null,
  isLoading: true,
});

export const AudiusSdkProvider = ({ children }: { children: ReactNode }) => {
  const { audiusLibs } = useAudiusLibs();
  const [audiusSdk, setAudiusSdk] = useState<AudiusSdkType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const envVars = useEnvVars();

  // @ts-expect-error ts(2741). This is only here for debugging and should eventually be removed
  window.audiusSdk = audiusSdk;

  const initSdk = () => {
    if (!window.Web3) {
      return;
    }

    if (!audiusSdk) {
      const logger = new Logger({ logLevel: "info" });

      // Determine config to use
      let config = developmentConfig as ServicesConfig;
      let initialSelectedNode = "http://audius-protocol-discovery-provider-1";
      if (envVars.env === "prod") {
        config = productionConfig as ServicesConfig;
        initialSelectedNode = "https://discoveryprovider.audius.co";
      } else if (envVars.env === "stage") {
        config = stagingConfig as ServicesConfig;
        initialSelectedNode = "https://discoveryprovider.staging.audius.co";
      }

      // Get keys
      const apiKey = process.env.ddex_key;
      const apiSecret = process.env.ddex_secret;
      if (!apiKey || !apiSecret) {
        setIsLoading(false);
        return;
      }

      // Init SDK
      const discoveryNodeSelector = new DiscoveryNodeSelector({
        initialSelectedNode,
      });
      const storageNodeSelector = new StorageNodeSelector({
        auth: new AppAuth(apiKey, apiSecret),
        discoveryNodeSelector: discoveryNodeSelector,
        bootstrapNodes: config.storageNodes,
        logger,
      });
      const sdkInst = sdk({
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
        apiKey: apiKey,
        apiSecret: apiSecret,
        appName: "DDEX Demo",
      });

      setAudiusSdk(sdkInst as AudiusSdkType);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void initSdk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audiusLibs]);

  const contextValue = {
    audiusSdk,
    isLoading,
  };
  return (
    <AudiusSdkContext.Provider value={contextValue}>
      {children}
    </AudiusSdkContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAudiusSdk = () => useContext(AudiusSdkContext);
