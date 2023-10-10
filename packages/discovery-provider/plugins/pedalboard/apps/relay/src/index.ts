import { Config, readConfig } from './config/config'
import { ethers, providers } from 'ethers'
import { WalletManager } from './walletManager'
import { logger } from './logger'
import { initializeDiscoveryDb } from '@pedalboard/basekit'
import { connectWeb3 } from './web3'
import { app } from './server'

export type SharedData = {
  config: Config
  web3: ethers.providers.JsonRpcProvider
  wallets: WalletManager
}

export const config = readConfig()

if (!config.aao.useAao) {
  logger.warn("anti abuse not configured and won't be enforced")
}

export const discoveryDb = initializeDiscoveryDb(
  config.discoveryDbConnectionString
)

export let web3: providers.JsonRpcProvider
export let wallets: WalletManager

const main = async () => {
  // async config
  const connectedWeb3 = await connectWeb3(config)
  web3 = connectedWeb3.web3
  config.acdcChainId = connectedWeb3.chainId.toString()
  wallets = new WalletManager(web3)

  // start webserver after async config
  const { serverHost, serverPort } = config
  app.listen(serverPort, serverHost, () =>
    logger.info({ serverHost, serverPort }, 'server initialized')
  )
}

main().catch(logger.error.bind(logger))
