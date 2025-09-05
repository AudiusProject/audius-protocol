import { useQueryContext } from '@audius/common/api'
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react'
import { PublicKey } from '@solana/web3.js'
import { useMutation } from '@tanstack/react-query'

import { appkitModal } from 'app/ReownAppKitModal'

import { buildAndSendTransaction } from '../../../common/src/api/tan-query/jupiter/utils'

export type LaunchCoinParams = {
  name: string
  symbol: string
  description: string
  walletPublicKey: PublicKey | string
  initialBuyAmountAudio?: number
  image: File | Blob
}

export type LaunchCoinResponse = {
  mintPublicKey: string
  createPoolTx: string
  firstBuyTx: string | null
  metadataUri: string
}

/**
 * Hook for launching a new coin on the launchpad with bonding curve.
 * This creates a new token and optionally makes an initial purchase.
 */
export const useLaunchCoin = () => {
  const { audiusSdk, reportToSentry } = useQueryContext()

  return useMutation<LaunchCoinResponse, Error, LaunchCoinParams>({
    mutationFn: async (
      params: LaunchCoinParams
    ): Promise<LaunchCoinResponse> => {
      try {
        const sdk = await audiusSdk()

        const solanaProvider = appkitModal.getProvider<SolanaProvider>('solana')
        if (!solanaProvider) {
          throw new Error('Missing SolanaProvider')
        }

        if (!params.walletPublicKey) {
          throw new Error('Missing solana wallet keypair')
        }

        const walletPublicKey = new PublicKey(params.walletPublicKey)

        // First call the solana relay method to initialize the coin metadata & set up transaction instructions
        const { createPoolTx, firstBuyTx, metadataUri, mintPublicKey } =
          await sdk.services.solanaRelay.launchCoin({
            name: params.name,
            symbol: params.symbol,
            description: params.description,
            walletPublicKey,
            initialBuyAmountAudio: params.initialBuyAmountAudio,
            image: params.image
          })

        // Create the bonding curve pool
        const createPoolSignature =
          await solanaProvider.signAndSendTransaction(createPoolTx)

        // Pool successfully created!

        // const createPoolSignature = await connection.sendTransaction(
        //   createPoolTx,
        //   [payer, mintKeypair]
        // )
        // await connection.confirmTransaction(createPoolSignature, 'confirmed')
        // console.log(
        //   '✅ Pool creation transaction confirmed:',
        //   createPoolSignature
        // )

        // Create first buy
        // const firstBuyTx = poolConfig.swapBuyTx
        // if (firstBuyTx) {
        //   firstBuyTx.feePayer = payer.publicKey
        //   firstBuyTx.recentBlockhash = (
        //     await connection.getLatestBlockhash()
        //   ).blockhash
        //   firstBuyTx.sign(payer)
        //   const firstBuySignature = await connection.sendTransaction(
        //     firstBuyTx,
        //     [payer]
        //   )
        //   await connection.confirmTransaction(firstBuySignature, 'confirmed')
        //   console.log('✅ First buy transaction confirmed:', firstBuySignature)
        // }
        // Now we register our coin in our database

        // TODO: Now do the first buy - first we convert SOL to AUDIO
        // TODO: Now perform the first buy transaction
        // DONE

        return result
      } catch (error) {
        console.error('Error launching coin:', error)
        throw error instanceof Error
          ? error
          : new Error('Failed to launch coin')
      }
    },
    onMutate: async (_params) => {},
    onSuccess: (_result, _params, _context) => {},
    onError: (error, params, _context) => {
      if (reportToSentry) {
        reportToSentry({
          error: error instanceof Error ? error : new Error(error as string),
          name: 'Launch Coin',
          feature: Feature.TanQuery,
          additionalInfo: {
            coinName: params.name,
            coinSymbol: params.symbol,
            initialBuyAmount: params.initialBuyAmountAudio ?? 0
          }
        })
      }
    },
    onSettled: (_result, _error, _params, _context) => {
      // Mutation completed - could add additional cleanup here if needed
    }
  })
}
