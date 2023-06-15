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
      useRelay: process.env.useRelay,
    },
    ethWeb3Config: {
      tokenAddress: process.env.tokenAddress,
      registryAddress: process.env.registryAddress,
      providers: process.env.providers?.split(","),
      ownerWallet: process.env.ownerWallet,
      claimDistributionContractAddress:
        process.env.claimDistributionContractAddress,
      wormholeContractAddress: process.env.wormholeContractAddress,
    },
  };

  const libsConfig = {
    solanaWeb3Config: config.solanaWeb3Config,
    ethWeb3Config: config.ethWeb3Config,
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
