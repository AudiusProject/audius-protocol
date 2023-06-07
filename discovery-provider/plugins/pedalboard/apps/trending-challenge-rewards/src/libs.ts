import { AudiusLibs } from "@audius/sdk";

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
    useRelay: process.env.useRelay
  },
}

// TODO: promote this into a packages instead of tcr
export const initAudiusLibs = async (): Promise<AudiusLibs> => {
  const libsConfig = {
    solanaWeb3Config: config.solanaWeb3Config,
    isServer: true,
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
