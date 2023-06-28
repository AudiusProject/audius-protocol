import { AudiusLibs } from "@audius/sdk";
import HDWalletProvider from '@truffle/hdwallet-provider'
import Web3 from 'web3'

// TODO: promote this into a packages
export const initAudiusLibs = async (): Promise<AudiusLibs> => {
  const localKeyProvider = new HDWalletProvider({
    privateKeys: [process.env.OWNER_PRIVATE_KEY],
    providerOrUrl: process.env.ETH_PROVIDER_ENDPOINT
  })
  const providers = [new Web3(localKeyProvider)]

  const audiusLibs = new AudiusLibs({
    // @ts-ignore
    ethWeb3Config: AudiusLibs.configEthWeb3(
      process.env.ETH_TOKEN_ADDRESS,
      process.env.ETH_REGISTRY_ADDRESS,
      providers,
      process.env.OWNER_WALLET
    ),
    isServer: true,
    enableUserReplicaSetManagerContract: true
  })
  await audiusLibs.init();
  return audiusLibs;
};
