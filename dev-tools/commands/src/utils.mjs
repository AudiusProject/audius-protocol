import { readFile } from "fs/promises";
import path from "path";

import { libs as AudiusLibs, sdk as AudiusSdk } from "@audius/sdk";
import { PublicKey } from "@solana/web3.js";
import { default as axios } from "axios";
import pkg from 'ethereumjs-wallet';
const { default: EthereumWallet } = pkg;

export const ACCOUNTS_PATH = "/tmp/accounts";

export const initializeAudiusLibs = async (poaWeb3PrivateKey) => {
  const audiusLibs = new AudiusLibs({
    ethWeb3Config: AudiusLibs.configEthWeb3(
      process.env.ETH_TOKEN_ADDRESS,
      process.env.ETH_REGISTRY_ADDRESS,
      process.env.ETH_PROVIDER_URL,
      process.env.ETH_OWNER_WALLET,
    ),
    web3Config: AudiusLibs.configInternalWeb3(
      process.env.POA_REGISTRY_ADDRESS,
      process.env.POA_PROVIDER_URL,
      poaWeb3PrivateKey,
    ),
    solanaWeb3Config: AudiusLibs.configSolanaWeb3({
      solanaClusterEndpoint: process.env.SOLANA_ENDPOINT,
      solanaTokenAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      mintAddress: process.env.SOLANA_TOKEN_MINT_PUBLIC_KEY,
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

export const initializeAudiusSdk = async () => {
  return AudiusSdk({
    appName: "audius-cmd",
    ethWeb3Config: AudiusLibs.configEthWeb3(
      process.env.ETH_TOKEN_ADDRESS,
      process.env.ETH_REGISTRY_ADDRESS,
      process.env.ETH_PROVIDER_URL,
      process.env.ETH_OWNER_WALLET,
    ),
    web3Config: AudiusLibs.configInternalWeb3(
      process.env.POA_REGISTRY_ADDRESS,
      process.env.POA_PROVIDER_URL,
      poaWeb3PrivateKey,
    ),
    discoveryProviderConfig: {},
    identityServiceConfig: AudiusLibs.configIdentityService(
      process.env.IDENTITY_SERVICE_URL,
    ),
  });
};

export const parseSolanaTokenAddress = async (account) => {
    let address;
    if (account.startsWith("@")) { // handle
      try {
        ({ data: { data: { spl_wallet: address } } } = await axios.get(
          `users/handle/${account.slice(1)}`,
          { baseURL: "http://discovery-provider:5000/v1" },
        ));
      } catch (err) {
        throw new Error(`Could not find user with handle ${account}`);
      }
    } else if (account.length < 32) { // user id
      try {
        ({ data: { data: { spl_wallet: address } } } = await axios.get(
          `users/${account}`,
          { baseURL: "http://discovery-provider:5000/v1" },
        ));
      } catch (err) {
        throw new Error(`Could not find user with user id ${account}`);
      }
    } else { // solana token address
      address = account;
    }

    return new PublicKey(address);
};

export const parsePOAOwnerWallet = async (account) => {
  let fromPrivateKey;
  if (account.startsWith("0x")) { // private key
    fromPrivateKey = from;
  } else { // handle
    fromPrivateKey = await readFile(path.join(ACCOUNTS_PATH, account), "utf8");
  }

  return new EthereumWallet(Buffer.from(fromPrivateKey, "hex"));
};
