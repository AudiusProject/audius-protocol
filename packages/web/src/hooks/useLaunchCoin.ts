import {
  getArtistCoinsQueryKey,
  getUserCreatedCoinsQueryKey,
  useQueryContext
} from '@audius/common/api'
import { Feature } from '@audius/common/models'
import { Id } from '@audius/sdk'
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { appkitModal } from 'app/ReownAppKitModal'

/* eslint-disable no-console */

export type LaunchCoinParams = {
  userId: number
  name: string
  symbol: string
  description: string
  walletPublicKey: PublicKey | string
  initialBuyAmountSol?: number
  image: File | Blob
}

export type LaunchCoinResponse = {
  newMint: string
  logoUri: string
}

/**
 * Hook for launching a new coin on the launchpad with bonding curve.
 * This creates a new token and optionally makes an initial purchase.
 */
export const useLaunchCoin = () => {
  const { audiusSdk, reportToSentry } = useQueryContext()
  const queryClient = useQueryClient()

  return useMutation<LaunchCoinResponse, Error, LaunchCoinParams>({
    mutationFn: async (
      params: LaunchCoinParams
    ): Promise<LaunchCoinResponse> => {
      try {
        console.log('Launching coin...', params)
        const sdk = await audiusSdk()
        const solanaProvider = appkitModal.getProvider<SolanaProvider>('solana')
        if (!solanaProvider) {
          throw new Error('Missing SolanaProvider')
        }
        if (!params.walletPublicKey) {
          throw new Error('Missing solana wallet keypair')
        }

        const signAndSendTx = async (transactionSerialized: string) => {
          // // Deserialize the pool transaction
          const deserializedTx = VersionedTransaction.deserialize(
            Buffer.from(transactionSerialized, 'base64')
          )

          // Create the bonding curve pool
          const txSignature =
            await solanaProvider.signAndSendTransaction(deserializedTx)

          // Wait for confirmation
          await sdk.services.solanaClient.connection.confirmTransaction(
            txSignature,
            'confirmed'
          )

          return txSignature
        }

        const walletPublicKey = new PublicKey(params.walletPublicKey)

        console.log('Sending request to relay to launch coin...')
        // Get quote
        // Set up coin TXs on relay side
        const {
          createPoolTx: createPoolTxSerialized,
          firstBuyTx: firstBuyTxSerialized,
          jupiterSwapTx: jupiterSwapTxSerialized,
          metadataUri,
          mintPublicKey,
          imageUri
        } = await sdk.services.solanaRelay.launchCoin({
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          walletPublicKey,
          initialBuyAmountSol: params.initialBuyAmountSol,
          image: params.image
        })

        console.log('Relay launch_coin response received!', {
          createPoolTxSerialized,
          firstBuyTxSerialized,
          jupiterSwapTxSerialized,
          metadataUri,
          mintPublicKey
        })

        // Sign pool tx
        console.log('Signing pool tx')
        const createPoolTxSignature = await signAndSendTx(
          createPoolTxSerialized
        )
        console.log(
          'Pool created successfully! createPoolTxSignature',
          createPoolTxSignature
        )

        try {
          // Create coin in Audius database
          console.log('Adding coin to Audius database')
          const coinRes = await sdk.coins.createCoin({
            userId: Id.parse(params.userId),
            createCoinRequest: {
              mint: mintPublicKey,
              ticker: `$${params.symbol}`,
              decimals: 9,
              name: params.name,
              logoUri: imageUri
            }
          })
          console.log('Coin added to Audius database', coinRes)
        } catch (e) {
          console.error('Error adding coin to Audius database', e)
        }

        // Perform sol->audio swap & first buy
        if (
          firstBuyTxSerialized &&
          jupiterSwapTxSerialized &&
          params.initialBuyAmountSol &&
          params.initialBuyAmountSol > 0
        ) {
          // Jupiter swap
          console.log('Sending Jupiter first buy tx to user to sign')
          const jupiterSwapTxSignature = await signAndSendTx(
            jupiterSwapTxSerialized
          )
          console.log('Jupiter first buy tx signed', jupiterSwapTxSignature)

          // First buy
          console.log('Sending first buy tx to user to sign')
          const firstBuyTxSignature = await signAndSendTx(firstBuyTxSerialized)
          console.log('First buy tx signed', firstBuyTxSignature)
        }

        return {
          newMint: mintPublicKey,
          logoUri: imageUri
        }
      } catch (error) {
        console.error('Error launching coin:', error)
        throw error instanceof Error
          ? error
          : new Error('Failed to launch coin')
      }
    },
    onMutate: async (_params) => {},
    onSuccess: (_result, params, _context) => {
      // TODO: any more invalidations needed here?
      // Invalidate the list of artist coins to add it to the list
      queryClient.invalidateQueries({ queryKey: getArtistCoinsQueryKey() })
      // Invalidate our user - this will refresh their badge info
      // TODO: this will eventually more to the users metadata
      queryClient.invalidateQueries({
        queryKey: getUserCreatedCoinsQueryKey(params.userId)
      })
    },
    onError: (error, params, _context) => {
      if (reportToSentry) {
        reportToSentry({
          error: error instanceof Error ? error : new Error(error as string),
          name: 'Launch Coin',
          feature: Feature.TanQuery,
          additionalInfo: {
            coinName: params.name,
            coinSymbol: params.symbol,
            initialBuyAmount: params.initialBuyAmountSol ?? 0
          }
        })
      }
    },
    onSettled: (_result, _error, _params, _context) => {
      // Mutation completed - could add additional cleanup here if needed
    }
  })
}
