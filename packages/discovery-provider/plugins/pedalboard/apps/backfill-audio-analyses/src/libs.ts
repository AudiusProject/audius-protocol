import { AudiusLibs } from "@audius/sdk";
import HDWalletProvider from "@truffle/hdwallet-provider";
import Web3 from "web3";
import { config } from '.'

const publicKey = config.delegateOwnerWallet;
const privateKey = config.delegatePrivateKey;
const providerEndpoint = config.web3EthProviderUrl;

export const initAudiusLibs = async (): Promise<AudiusLibs> => {
  if (!privateKey) {
    throw new Error("Missing privateKey");
  }
  if (!providerEndpoint) {
    throw new Error("Missing providerEndpoint");
  }

  const localKeyProvider = new HDWalletProvider({
    privateKeys: [privateKey],
    providerOrUrl: providerEndpoint,
  });
  const providers = [new Web3(localKeyProvider)];

  const audiusLibs = new AudiusLibs({
    // @ts-ignore
    ethWeb3Config: AudiusLibs.configEthWeb3(
      config.ethTokenAddress,
      config.ethContractsRegistry,
      providers,
      publicKey
    ),
    isServer: true,
    enableUserReplicaSetManagerContract: true,
  });
  await audiusLibs.init();
  return audiusLibs;
};
