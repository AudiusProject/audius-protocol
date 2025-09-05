import {
  QUERY_KEYS,
  getArtistCoinsQueryKey,
  getUserCoinQueryKey,
  getUserCreatedCoinsQueryKey,
  getUserQueryKey,
  useQueryContext
} from '@audius/common/api'
import { Feature } from '@audius/common/models'
import { Id } from '@audius/sdk'
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { appkitModal } from 'app/ReownAppKitModal'

export type LaunchCoinParams = {
  userId: number
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
  const queryClient = useQueryClient()

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

        console.log('Sending request to relay...')
        // First call the solana relay method to initialize the coin metadata & set up transaction instructions
        const {
          createPoolTx: createPoolTxSerialized,
          firstBuyTx,
          metadataUri,
          mintPublicKey
        } = await sdk.services.solanaRelay.launchCoin({
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          walletPublicKey,
          initialBuyAmountAudio: params.initialBuyAmountAudio,
          image: params.image
        })
        console.log('Relay response received', {
          createPoolTxSerialized,
          firstBuyTx,
          metadataUri,
          mintPublicKey
        })

        // Deserialize the transaction
        const createPoolTx = VersionedTransaction.deserialize(
          Buffer.from(createPoolTxSerialized, 'base64')
        )

        console.log('Pool TX Deserialized', {
          createPoolTx,
          createPoolTxSerialized
        })

        // Create the bonding curve pool
        const createPoolTxSignature =
          await solanaProvider.signAndSendTransaction(createPoolTx)

        console.log('Pool TX Signed', {
          createPoolTxSignature
        })

        // Wait for confirmation
        await sdk.services.solanaClient.connection.confirmTransaction(
          createPoolTxSignature,
          'confirmed'
        )

        console.log('Pool TX Confirmed')

        if (createPoolTxSignature) {
          console.log('Creating coin in Audius database')
          const coinRes = await sdk.coins.createCoin({
            userId: Id.parse(params.userId),
            createCoinRequest: {
              mint: mintPublicKey,
              ticker: `$${params.symbol}`,
              decimals: 9,
              name: params.name
            }
          })
          console.log('Coin created in Audius database', coinRes)
        }

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

        return {
          mintPublicKey,
          createPoolTx: createPoolTxSignature,
          firstBuyTx,
          metadataUri
        }
      } catch (error) {
        console.error('Error launching coin:', error)
        throw error instanceof Error
          ? error
          : new Error('Failed to launch coin')
      }
    },
    onMutate: async (_params) => {},
    onSuccess: (result, params, _context) => {
      queryClient.invalidateQueries({ queryKey: getArtistCoinsQueryKey() })
      // Invalidate our user - this will refresh their badge info
      queryClient.invalidateQueries({
        queryKey: getUserCreatedCoinsQueryKey(params.userId)
      })

      queryClient.invalidateQueries({
        queryKey: getUserCoinQueryKey(result.mintPublicKey)
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
    },
    onSettled: (_result, _error, _params, _context) => {
      // Mutation completed - could add additional cleanup here if needed
    }
  })
}
