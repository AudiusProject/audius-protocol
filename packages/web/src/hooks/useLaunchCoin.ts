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
  walletPublicKey: string
  initialBuyAmountSol?: number
  image: Blob
}

export type LaunchCoinResponse = {
  newMint: string
  logoUri: string
}

const COIN_DECIMALS = 9 // All our launched coins will have 9 decimals

/**
 * Hook for launching a new coin on the launchpad with bonding curve.
 * This creates a new token and optionally makes an initial purchase.
 */
export const useLaunchCoin = () => {
  const { audiusSdk, reportToSentry } = useQueryContext()
  const queryClient = useQueryClient()

  return useMutation<LaunchCoinResponse, Error, LaunchCoinParams>({
    mutationFn: async ({
      userId,
      name,
      symbol,
      description,
      walletPublicKey: walletPublicKeyStr,
      initialBuyAmountSol,
      image
    }: LaunchCoinParams): Promise<LaunchCoinResponse> => {
      try {
        console.log('Launching coin...', {
          userId,
          name,
          symbol,
          description,
          walletPublicKeyStr,
          initialBuyAmountSol,
          image
        })
        const sdk = await audiusSdk()
        const solanaProvider = appkitModal.getProvider<SolanaProvider>('solana')
        if (!solanaProvider) {
          throw new Error('Missing SolanaProvider')
        }
        if (!walletPublicKeyStr) {
          throw new Error('Missing solana wallet keypair')
        }

        const signAndSendTx = async (transactionSerialized: string) => {
          // Deserialize the pool transaction
          const deserializedTx = VersionedTransaction.deserialize(
            Buffer.from(transactionSerialized, 'base64')
          )

          // Sends the transaction to the 3rd party wallet to sign & sends directly to solana from there
          const txSignature =
            await solanaProvider.signAndSendTransaction(deserializedTx)

          // Wait for confirmation
          await sdk.services.solanaClient.connection.confirmTransaction(
            txSignature,
            'confirmed'
          )

          return txSignature
        }

        const walletPublicKey = new PublicKey(walletPublicKeyStr)

        console.log('Sending request to relay to launch coin...')
        // Set up coin TXs on relay side
        const res = await sdk.services.solanaRelay.launchCoin({
          name,
          symbol,
          description,
          walletPublicKey,
          initialBuyAmountSol,
          image
        })
        const {
          createPoolTx: createPoolTxSerialized,
          firstBuyTx: firstBuyTxSerialized,
          solToAudioTx: solToAudioTxSerialized,
          metadataUri,
          mintPublicKey,
          imageUri
        } = res

        console.log('Relay launch_coin response received!', {
          createPoolTxSerialized,
          firstBuyTxSerialized,
          solToAudioTxSerialized,
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
            userId: Id.parse(userId),
            createCoinRequest: {
              mint: mintPublicKey,
              ticker: `$${symbol}`,
              decimals: COIN_DECIMALS,
              name,
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
          solToAudioTxSerialized &&
          initialBuyAmountSol &&
          initialBuyAmountSol > 0
        ) {
          // Sol to audio swap
          console.log('Sending sol to audio swap tx to user to sign')
          const solToAudioTx = await signAndSendTx(solToAudioTxSerialized)
          console.log('Jupiter first buy tx signed', solToAudioTx)

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
    onSuccess: (_result, params, _context) => {
      // Invalidate the list of artist coins to add it to the list
      queryClient.invalidateQueries({ queryKey: getArtistCoinsQueryKey() })
      // Invalidate our user - this will refresh their badge info
      // TODO: this will eventually move to the users metadata
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
    }
  })
}
