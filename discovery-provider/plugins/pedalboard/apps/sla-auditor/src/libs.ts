import { AudiusLibs } from "@audius/sdk";

// TODO: promote this into a packages
export const initAudiusLibs = async (): Promise<AudiusLibs> => {
  const config = {
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
