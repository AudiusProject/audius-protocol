import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
import Web3 from "web3"

const clientId = ""

const ganacheChainConfig = {
  chainId: "0xE8D4A51001",
  rpcTarget: "http://audius-protocol-poa-ganache-1:8545",
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  displayName: "ACDC Local",
  blockExplorerUrl: "https://healthz.audius.co/#/stage/explorer",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cdn.iconscout.com/icon/free/png-256/free-lightning-120-453014.png"
}

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig: ganacheChainConfig },
})

export const web3authInstance = new Web3Auth({
  clientId,
  chainConfig: ganacheChainConfig,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider: privateKeyProvider,
  uiConfig: {
    loginMethodsOrder: ["google", "github", "warpcast"]
  }
})

export const getWeb3Provider = (): Web3 => {
  return new Web3(web3authInstance.provider as any)
}
