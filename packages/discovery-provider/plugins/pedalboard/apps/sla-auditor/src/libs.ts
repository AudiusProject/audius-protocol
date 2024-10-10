import { AudiusLibs } from '@audius/sdk-legacy/dist/libs'
import HDWalletProvider from '@truffle/hdwallet-provider'
import Web3 from 'web3'

const publicKey = process.env.audius_delegate_owner_wallet
const privateKey = process.env.audius_delegate_private_key
const providerEndpoint = process.env.audius_web3_eth_provider_url

export const initAudiusLibs = async (): Promise<AudiusLibs> => {
  if (!privateKey) {
    throw new Error('Missing privateKey')
  }
  if (!providerEndpoint) {
    throw new Error('Missing providerEndpoint')
  }

  const localKeyProvider = new HDWalletProvider({
    privateKeys: [privateKey],
    providerOrUrl: providerEndpoint
  })
  const providers = [new Web3(localKeyProvider)]

  const audiusLibs = new AudiusLibs({
    // @ts-ignore
    ethWeb3Config: AudiusLibs.configEthWeb3(
      process.env.audius_eth_token_address,
      process.env.audius_eth_contracts_registry,
      providers,
      publicKey
    ),
    isServer: true,
    enableUserReplicaSetManagerContract: true
  })
  await audiusLibs.init()
  return audiusLibs
}
