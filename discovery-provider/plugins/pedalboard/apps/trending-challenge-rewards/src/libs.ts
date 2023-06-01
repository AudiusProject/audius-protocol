import { AudiusLibs } from "@audius/sdk";

export const initAudiusLibs = async (): Promise<AudiusLibs> => {
  const config = {
    web3Config,
    ethWeb3Config,
    solanaWeb3Config,
    identityServiceConfig,
    discoveryProviderConfig,
    creatorNodeConfig,
    comstockConfig,
    wormholeConfig,
    hedgehogConfig,
    isServer,
    logger,
    isDebug,
    preferHigherPatchForPrimary,
    preferHigherPatchForSecondaries,
    localStorage,
    isStorageV2Only: false,
  };
  const libs = new AudiusLibs(config);
  await libs.init();
  return libs;
};
