import type { AudiusLibs as AudiusLibsType } from "@audius/sdk/dist/WebAudiusLibs.d.ts";
import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { useEnvVars } from "./EnvVarsProvider";

type AudiusLibsContextType = {
  audiusLibs: AudiusLibsType | null;
  isLoading: boolean;
  isReadOnly: boolean; // read-only means the user can't approve transactions (i.e., no external wallet connected)
};
const AudiusLibsContext = createContext<AudiusLibsContextType>({
  audiusLibs: null,
  isLoading: true,
  isReadOnly: true,
});

export const AudiusLibsProvider = ({ children }: { children: ReactNode }) => {
  const [audiusLibs, setAudiusLibs] = useState<AudiusLibsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const envVars = useEnvVars();

  // @ts-expect-error (TS2741). This is only here for debugging and should eventually be removed
  window.audiusLibs = audiusLibs;

  const initLibraries = async () => {
    const audiusLibs = await initLibsWithoutAccount(envVars);
    setAudiusLibs(audiusLibs);
    setIsReadOnly(true);
    setIsLoading(false);
  };

  useEffect(() => {
    if (envVars.ethProviderUrl) {
      void initLibraries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envVars]);

  const contextValue = {
    audiusLibs,
    isLoading,
    isReadOnly,
  };
  return (
    <AudiusLibsContext.Provider value={contextValue}>
      {children}
    </AudiusLibsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAudiusLibs = () => useContext(AudiusLibsContext);

// Returns an Audius libs instance that isn't connected to any wallet, so it can't approve transactions
const initLibsWithoutAccount = async (
  envVars: ReturnType<typeof useEnvVars>,
): Promise<AudiusLibsType> => {
  // Dynamically import hefty libraries so that we don't have to include them in the main index bundle
  const audiusSdkModule = await import("@audius/sdk/dist/web-libs.js");
  const AudiusLibs = audiusSdkModule.libs as unknown as typeof AudiusLibsType;

  const web3ProviderEndpoints =
    envVars.env === "stage"
      ? ["https://poa-gateway.staging.audius.co"]
      : ["https://poa-gateway.audius.co"];
  const web3Config = {
    registryAddress: envVars.ethRegistryAddress,
    entityManagerAddress: envVars.entityManagerAddress,
    useExternalWeb3: false,
    internalWeb3Config: {
      web3ProviderEndpoints,
    },
  };

  const ethWeb3Config = AudiusLibs.configEthWeb3(
    envVars.ethTokenAddress,
    envVars.ethRegistryAddress,
    envVars.ethProviderUrl,
    envVars.ethOwnerWallet,
    envVars.claimDistributionContractAddress,
    envVars.wormholeContractAddress,
  );

  const solanaWeb3Config = AudiusLibs.configSolanaWeb3({
    claimableTokenPDA: envVars.claimableTokenPda,
    solanaClusterEndpoint: envVars.solanaClusterEndpoint,
    mintAddress: envVars.wAudioMintAddress,
    usdcMintAddress: envVars.usdcMintAddress,
    solanaTokenAddress: envVars.solanaTokenProgramAddress,
    // @ts-expect-error (TS2322) Type 'string' is not assignable to type 'PublicKey'. This happens because libs has a bug where it sets the wrong type.
    feePayerAddress: envVars.solanaFeePayerAddress,
    claimableTokenProgramAddress: envVars.claimableTokenProgramAddress,
    rewardsManagerProgramId: envVars.rewardsManagerProgramId,
    rewardsManagerProgramPDA: envVars.rewardsManagerProgramPda,
    rewardsManagerTokenPDA: envVars.rewardsManagerTokenPda,
    useRelay: true,
  });

  const identityServiceConfig = {
    url: envVars.identityServiceEndpoint,
  };

  const audiusLibsConfig = {
    web3Config,
    ethWeb3Config,
    solanaWeb3Config,
    identityServiceConfig,
    discoveryProviderConfig: {},
    isServer: false,
    isDebug: envVars.env === "staging" || envVars.env === "development",
  };

  // @ts-expect-error (TS2345). It's complaining about not passing all the config args, but they're optional so we can ignore
  const audiusLibs = new AudiusLibs(audiusLibsConfig);
  await audiusLibs.init();
  return audiusLibs;
};
