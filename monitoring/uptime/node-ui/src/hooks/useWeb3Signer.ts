/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import type { Signer } from 'ethers'
import { useEffect, useState } from 'react'
import { useWalletClient, WalletClient } from 'wagmi'

// This should be import type { Web3 } from web3, but Audius libs forces us to use a version of web3 without this type
type Web3Type = any

// Converts a WalletClient to an ethers.js Signer
const walletClientToSigner = async (
  walletClient: WalletClient
): Promise<Signer> => {
  const { account, chain, transport } = walletClient
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  }

  // Dynamically import hefty libraries so that we don't have to include them in the main index bundle
  const ethersjs = await import('ethers')
  const { providers } = ethersjs

  const provider = new providers.Web3Provider(transport, network)
  const signer = provider.getSigner(account.address)
  return signer
}

// Hook to convert a wagmi Wallet Client to a Web3 Signer
const useWeb3Signer = (chainId?: number): Web3Type | undefined => {
  const { data: walletClient } = useWalletClient({ chainId })
  const [web3Instance, setWeb3Instance] = useState<Web3Type | undefined>(
    undefined
  )

  useEffect(() => {
    let isMounted = true

    const instantiateWeb3 = async () => {
      // Dynamically import hefty libraries so that we don't have to include them in the main index bundle
      const { default: Web3 } = await import('web3')

      if (isMounted && walletClient) {
        // Converting to an ethers signer and then web3 instance isn't compatible with Audius libs
        // because it expects it to have the send() or sendAsync() method. The workaround is to pass libs an RPC endpoint (string),
        // and after libs inits we set audiusLibs.ethWeb3Manager.web3 directly.
        // if (window.ethereum) {
        //   setWeb3Instance(window.ethereum)
        //   return
        // }

        const signer = await walletClientToSigner(walletClient)

        // @ts-expect-error ts(2339) - provider does exist on type Provider
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const web3 = new Web3(signer.provider.provider as any)
        setWeb3Instance(web3)
      }
    }

    void instantiateWeb3()

    return () => {
      isMounted = false
    }
  }, [walletClient])

  return web3Instance
}

export default useWeb3Signer
