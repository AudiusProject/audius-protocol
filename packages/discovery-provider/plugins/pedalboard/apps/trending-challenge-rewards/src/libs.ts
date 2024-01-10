import { AudiusLibs } from "@audius/sdk";

// TODO: promote this into a packages instead of tcr
export const initAudiusLibs = async (): Promise<AudiusLibs> => {
  const config = {
    solanaWeb3Config: {
      solanaClusterEndpoint: process.env.solanaClusterEndpoint,
      mintAddress: process.env.mintAddress,
      solanaTokenAddress: process.env.solanaTokenAddress,
      claimableTokenPDA: process.env.claimableTokenPDA,
      feePayerAddress: process.env.feePayerAddress,
      claimableTokenProgramAddress: process.env.claimableTokenProgramAddress,
      rewardsManagerProgramId: process.env.rewardsManagerProgramId,
      rewardsManagerProgramPDA: process.env.rewardsManagerProgramPDA,
      rewardsManagerTokenPDA: process.env.rewardsManagerTokenPDA,
      usdcMintAddress: process.env.usdcMintAddress,
      useRelay: process.env.useRelay,
    },
    ethWeb3Config: {
      tokenAddress: process.env.tokenAddress,
      registryAddress: process.env.registryAddress,
      providers: [process.env.providers],
      ownerWallet: process.env.ownerWallet,
      claimDistributionContractAddress:
        process.env.claimDistributionContractAddress,
      wormholeContractAddress: process.env.wormholeContractAddress,
    },
    identityServiceConfig: {
      url: process.env.identityUrl,
      useHedgehogLocalStorage: false,
    }
  };

  const libsConfig = {
    solanaWeb3Config: config.solanaWeb3Config,
    ethWeb3Config: config.ethWeb3Config,
    identityServiceConfig: config.identityServiceConfig,
    discoveryProviderConfig: {},
    logger: console,
    isDebug: false,
    localStorage: false,
    isStorageV2Only: false,
  };
  // @ts-ignore
  const libs = new AudiusLibs(libsConfig);
  await libs.init();
  return libs;
};
