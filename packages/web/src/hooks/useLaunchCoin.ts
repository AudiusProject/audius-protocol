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

// Leaving in consoles for QA and possibly soft-launch to make sure we have good info on where things are failing
/* eslint-disable no-console */

export type LaunchCoinParams = {
  userId: number
  name: string
  symbol: string
  description: string
  walletPublicKey: string
  initialBuyAmountAudio?: string
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
      initialBuyAmountAudio,
      image
    }: LaunchCoinParams): Promise<LaunchCoinResponse> => {
      const progress = {
        relayResponseReceived: false,
        poolTxSigned: false,
        poolCreateConfirmed: false,
        sdkCoinAdded: false,
        firstBuyTxSigned: false,
        firstBuyConfirmed: false
      }
      try {
        console.log('Launching coin...', {
          userId,
          name,
          symbol,
          description,
          walletPublicKeyStr,
          initialBuyAmountAudio
        })
        const symbolUpper = symbol.toUpperCase()
        const sdk = await audiusSdk()
        const solanaProvider = appkitModal.getProvider<SolanaProvider>('solana')
        if (!solanaProvider) {
          throw new Error('Missing SolanaProvider')
        }
        if (!walletPublicKeyStr) {
          throw new Error('Missing solana wallet keypair')
        }

        const signTx = async (transactionSerialized: string) => {
          // Transaction is sent from the backend as a serialized base64 string
          const deserializedTx = VersionedTransaction.deserialize(
            Buffer.from(transactionSerialized, 'base64')
          )

          // Triggers 3rd party wallet to sign the transaction, doesnt send to Solana just yet
          return await solanaProvider.signTransaction(deserializedTx)
        }

        const sendTx = async (transaction: VersionedTransaction) => {
          const txSignature = await solanaProvider.sendTransaction(
            transaction,
            await sdk.services.solanaClient.connection
          )
          // TODO: retries here?
          // Wait for confirmation
          await sdk.services.solanaClient.connection.confirmTransaction(
            txSignature,
            'confirmed'
          )

          return txSignature
        }

        const walletPublicKey = new PublicKey(walletPublicKeyStr)

        console.log('Sending request to relay to launch coin...')
        // Sets up coin TXs and on-chain metadata on relay side
        const res = await sdk.services.solanaRelay.launchCoin({
          name,
          symbol: symbolUpper,
          description,
          walletPublicKey,
          initialBuyAmountAudio,
          image
        })
        progress.relayResponseReceived = true
        const {
          createPoolTx: createPoolTxSerialized,
          firstBuyTx: firstBuyTxSerialized,
          metadataUri,
          mintPublicKey,
          imageUri
        } = res

        console.log('Relay launch_coin response received!', {
          createPoolTxSerialized,
          firstBuyTxSerialized,
          metadataUri,
          mintPublicKey
        })

        /**
         * Pool creation - sign & send TX
         */
        console.log('Signing pool tx')
        const createPoolTxSigned = await signTx(createPoolTxSerialized)
        progress.poolTxSigned = true
        console.log('Pool tx signed')

        const createPoolTxSignature = await sendTx(createPoolTxSigned)
        console.log(
          'Pool created successfully! createPoolTxSignature',
          createPoolTxSignature
        )
        progress.poolCreateConfirmed = true

        /*
         * Add coin to Audius database
         * its in a separate try/catch because it's technically non-blocking
         */
        try {
          // Create coin in Audius database
          console.log('Adding coin to Audius database')
          const coinRes = await sdk.coins.createCoin({
            userId: Id.parse(userId),
            createCoinRequest: {
              mint: mintPublicKey,
              ticker: `$${symbolUpper}`,
              decimals: COIN_DECIMALS,
              name,
              logoUri: imageUri,
              description
            }
          })
          progress.sdkCoinAdded = true
          console.log('Coin added to Audius database', coinRes)
        } catch (e) {
          // TODO: report critical error here
          console.error('Error adding coin to Audius database', e)
        }

        // Perform sol->audio swap & first buy
        if (firstBuyTxSerialized && initialBuyAmountAudio) {
          // First buy
          console.log('Sending first buy tx to user to sign')
          const firstBuyTxSigned = await signTx(firstBuyTxSerialized)
          progress.firstBuyTxSigned = true
          console.log('First buy tx signed')
          const firstBuyTxSignature = await sendTx(firstBuyTxSigned)
          progress.firstBuyConfirmed = true
          console.log('First buy tx confirmed', firstBuyTxSignature)
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
      // NOTE: this will eventually move to the users metadata
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
            initialBuyAmount: params.initialBuyAmountAudio ?? 0
          }
        })
      }
    }
  })
}
