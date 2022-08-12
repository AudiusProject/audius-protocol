import { libs as AudiusLibs } from "@audius/sdk";

export const initializeAudiusLibs = async () => {
  const audiusLibs = new AudiusLibs({
    ethWeb3Config: AudiusLibs.configEthWeb3(
      process.env.ETH_TOKEN_ADDRESS,
      process.env.ETH_REGISTRY_ADDRESS,
      process.env.ETH_PROVIDER_URL,
      process.env.ETH_OWNER_WALLET,
    ),
    web3Config: AudiusLibs.configExternalWeb3(
      process.env.POA_REGISTRY_ADDRESS,
      process.env.POA_PROVIDER_URL,
      "1000000000001",
    ),
    solanaWeb3Config: AudiusLibs.configSolanaWeb3({
      solanaClusterEndpoint: process.env.SOLANA_ENDPOINT,
      mintAddress: process.env.SOLANA_MINT_PUBLIC_KEY,
      claimableTokenProgramAddress: process.env.SOLANA_CLAIMABLE_TOKENS_PUBLIC_KEY,
      rewardsManagerProgramId: process.env.SOLANA_REWARD_MANAGER_PUBLIC_KEY,
      rewardsManagerProgramPDA: process.env.SOLANA_REWARD_MANAGER_PDA_PUBLIC_KEY,
      rewardsManagerTokenPDA: process.env.SOLANA_REWARD_MANAGER_TOKEN_PDA_PUBLIC_KEY,
      feePayerSecretKeys: [Uint8Array.from(JSON.parse(process.env.SOLANA_FEEPAYER_SECRET_KEY))],
      useRelay: true,
    }),
    discoveryProviderConfig: {},
    creatorNodeConfig: AudiusLibs.configCreatorNode(
      "http://audius-protocol-creator-node-1.audius-protocol_default:4000",
      // process.env.FALLBACK_CREATOR_NODE_URL,
    ),
    identityServiceConfig: AudiusLibs.configIdentityService(
      process.env.IDENTITY_SERVICE_URL,
    ),
    isServer: true,
    enableUserReplicaSetManagerContract: true,
  });

  await audiusLibs.init();

  return audiusLibs;
};
