import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

interface EnvVars {
  env: string;
  nodeType: string;
  audiusUrl: string;

  ddexKey: string;
  ddexSecret: string;

  ethNetworkId: string;
  ethTokenAddress: string;
  ethRegistryAddress: string;
  ethProviderUrl: string;
  ethOwnerWallet: string;

  queryProposalStartBlock: string; // call parseInt(queryProposalStartBlock || '0') when using
  gqlUri: string;
  gqlBackupUri: string;

  entityManagerAddress: string;

  identityServiceEndpoint: string;

  wormholeContractAddress: string;
  claimDistributionContractAddress: string;
  solanaClusterEndpoint: string;
  wAudioMintAddress: string;
  usdcMintAddress: string;
  solanaTokenProgramAddress: string;
  claimableTokenPda: string;
  solanaFeePayerAddress: string;
  claimableTokenProgramAddress: string;
  rewardsManagerProgramId: string;
  rewardsManagerProgramPda: string;
  rewardsManagerTokenPda: string;
  optimizelySdkKey: string;
}

// Local testing sets overrides for env vars that would normally be fetched from the node
const envVarOverrides = {
  env: (import.meta.env.VITE_ENV_OVERRIDE ?? "") as string,
  nodeType: (import.meta.env.VITE_NODE_TYPE_OVERRIDE ?? "") as string,
  audiusUrl: (import.meta.env.VITE_AUDIUS_URL_OVERRIDE ?? "") as string,

  ddexKey: (import.meta.env.VITE_DDEX_KEY_OVERRIDE ?? "") as string,
  ddexSecret: (import.meta.env.VITE_DDEX_SECRET_OVERRIDE ?? "") as string,

  ethNetworkId: (import.meta.env.VITE_ETH_NETWORK_ID_OVERRIDE ?? "") as string,
  ethTokenAddress: (import.meta.env.VITE_ETH_TOKEN_ADDRESS_OVERRIDE ??
    "") as string,
  ethRegistryAddress: (import.meta.env.VITE_ETH_REGISTRY_ADDRESS_OVERRIDE ??
    "") as string,
  ethProviderUrl: (import.meta.env.VITE_ETH_PROVIDER_URL_OVERRIDE ??
    "") as string,
  ethOwnerWallet: (import.meta.env.VITE_ETH_OWNER_WALLET_OVERRIDE ??
    "") as string,

  queryProposalStartBlock: (import.meta.env
    .VITE_QUERY_PROPOSAL_START_BLOCK_OVERRIDE ?? "") as string,
  gqlUri: (import.meta.env.VITE_QQL_URI_OVERRIDE ?? "") as string,
  gqlBackupUri: (import.meta.env.VITE_QQL_BACKUP_URI_OVERRIDE ?? "") as string,

  entityManagerAddress: (import.meta.env.VITE_ENTITY_MANAGER_ADDRESS_OVERRIDE ??
    "") as string,

  identityServiceEndpoint: (import.meta.env
    .VITE_IDENTITY_SERVICE_ENDPOINT_OVERRIDE ?? "") as string,

  wormholeContractAddress: (import.meta.env
    .VITE_WORMHOLE_CONTRACT_ADDRESS_OVERRIDE ?? "") as string,
  claimDistributionContractAddress: (import.meta.env
    .VITE_CLAIM_DISTRIBUTION_CONTRACT_ADDRESS_OVERRIDE ?? "") as string,
  solanaClusterEndpoint: (import.meta.env
    .VITE_SOLANA_CLUSTER_ENDPOINT_OVERRIDE ?? "") as string,
  wAudioMintAddress: (import.meta.env.VITE_WAUDIO_MINT_ADDRESS_OVERRIDE ??
    "") as string,
  usdcMintAddress: (import.meta.env.VITE_USDC_MINT_ADDRESS_OVERRIDE ??
    "") as string,
  solanaTokenProgramAddress: (import.meta.env
    .VITE_SOLANA_TOKEN_PROGRAM_ADDRESS_OVERRIDE ?? "") as string,
  claimableTokenPda: (import.meta.env.VITE_CLAIMABLE_TOKEN_PDA_OVERRIDE ??
    "") as string,
  solanaFeePayerAddress: (import.meta.env
    .VITE_SOLANA_FEE_PAYER_ADDRESS_OVERRIDE ?? "") as string,
  claimableTokenProgramAddress: (import.meta.env
    .VITE_CLAIMABLE_TOKEN_PROGRAM_ADDRESS_OVERRIDE ?? "") as string,
  rewardsManagerProgramId: (import.meta.env
    .VITE_REWARDS_MANAGER_PROGRAM_ID_OVERRIDE ?? "") as string,
  rewardsManagerProgramPda: (import.meta.env
    .VITE_REWARDS_MANAGER_PROGRAM_PDA_OVERRIDE ?? "") as string,
  rewardsManagerTokenPda: (import.meta.env
    .VITE_REWARDS_MANAGER_TOKEN_PDA_OVERRIDE ?? "") as string,
  optimizelySdkKey: (import.meta.env.VITE_OPTIMIZELY_SDK_KEY_OVERRIDE ?? "") as string,
};
const endpoint = (import.meta.env.VITE_NODE_URL_OVERRIDE ||
  window.location.origin) as string;

type EnvVarsContextType = EnvVars & { endpoint: string };
const EnvVarsContext = createContext<EnvVarsContextType>({
  ...envVarOverrides,
  endpoint,
});

export const EnvVarsProvider = ({ children }: { children: ReactNode }) => {
  const [envVars, setEnvVars] = useState<EnvVars>(envVarOverrides);

  useEffect(() => {
    const fetchEnvVars = async () => {
      try {
        const response = await fetch(`${endpoint}/d_api/env`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = (await response.json()) as EnvVars;
        setEnvVars(data);
      } catch (error) {
        console.error("Error fetching env vars:", error);
      }
    };

    // Stage and prod nodes fetch env vars exposed in audius-docker-compose
    if (!envVars.env || !envVars.nodeType) {
      void fetchEnvVars();
    }
  });

  const contextValue = { ...envVars, endpoint };
  return (
    <EnvVarsContext.Provider value={contextValue}>
      {children}
    </EnvVarsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useEnvVars = () => useContext(EnvVarsContext);
