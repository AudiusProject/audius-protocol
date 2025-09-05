import {
  getArtistCoinsQueryKey,
  getUserCreatedCoinsQueryKey,
  useQueryContext
} from '@audius/common/api'
import { Feature } from '@audius/common/models'
import { getJupiterSwapInstructions } from '@audius/common/src/api/tan-query/jupiter/utils'
import {
  getJupiterQuoteByMintWithRetry,
  convertJupiterInstructions,
  JupiterQuoteResult
} from '@audius/common/src/services/Jupiter'
import { TOKEN_LISTING_MAP } from '@audius/common/store'
import { Id } from '@audius/sdk'
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react'
import {
  PublicKey,
  VersionedTransaction,
  TransactionInstruction
} from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { appkitModal } from 'app/ReownAppKitModal'

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
}

/**
 * Hook for launching a new coin on the launchpad with bonding curve.
 * This creates a new token and optionally makes an initial purchase.
 */
export const useLaunchCoin = () => {
  const { audiusSdk, reportToSentry } = useQueryContext()
  const queryClient = useQueryClient()
  // Helper function to swap SOL to AUDIO using appkitModal provider
  const swapSolToAudio = async (
    quote: JupiterQuoteResult,
    amountSol: number,
    walletPublicKey: PublicKey,
    solanaProvider: SolanaProvider,
    sdk: any
  ): Promise<string> => {
    console.log('Starting SOL to AUDIO swap', { amountSol })

    // Build swap instructions
    const instructions: TransactionInstruction[] = []

    // Prepare output destination for AUDIO
    const outputTokenConfig = {
      mintAddress: TOKEN_LISTING_MAP.AUDIO.address,
      claimableTokenMint: new PublicKey(TOKEN_LISTING_MAP.AUDIO.address),
      decimals: 8
    }

    // Get Jupiter swap instructions
    const swapRequestParams = {
      quoteResponse: quote.quote,
      userPublicKey: walletPublicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicSlippage: true
    }

    // TODO: do we need to do some ATA stuff here?

    const { swapInstructionsResult } = await getJupiterSwapInstructions(
      swapRequestParams,
      outputTokenConfig,
      walletPublicKey,
      walletPublicKey, // feePayer is the wallet itself
      instructions
    )

    const { swapInstruction, addressLookupTableAddresses } =
      swapInstructionsResult
    const jupiterInstructions = convertJupiterInstructions([swapInstruction])
    instructions.push(...jupiterInstructions)

    // Build transaction
    const swapTx = await sdk.services.solanaClient.buildTransaction({
      feePayer: walletPublicKey,
      instructions,
      addressLookupTables: addressLookupTableAddresses
        ? addressLookupTableAddresses.map((addr: string) => new PublicKey(addr))
        : undefined
    })

    console.log('Built swap transaction', swapTx)

    // Sign and send with appkitModal provider
    const signature = await solanaProvider.signAndSendTransaction(swapTx)

    console.log('Swap transaction signed and sent', signature)

    // Confirm transaction
    await sdk.services.solanaClient.connection.confirmTransaction(
      signature,
      'confirmed'
    )

    console.log('Swap transaction confirmed')

    return signature
  }

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

        let initialBuyAmountAudio: number | undefined
        let initialBuyQuoteResult: JupiterQuoteResult | undefined
        // If there's an initial buy amount, we need to determine how much AUDIO this will convert to
        if (params.initialBuyAmountSol) {
          const { quoteResult } = await getJupiterQuoteByMintWithRetry({
            inputMint: TOKEN_LISTING_MAP.SOL.address,
            outputMint: TOKEN_LISTING_MAP.AUDIO.address,
            inputDecimals: TOKEN_LISTING_MAP.SOL.decimals,
            outputDecimals: TOKEN_LISTING_MAP.AUDIO.decimals,
            amountUi: params.initialBuyAmountSol ?? 0,
            swapMode: 'ExactIn',
            onlyDirectRoutes: false
          })
          console.log('Quote result', quoteResult)
          initialBuyQuoteResult = quoteResult
          initialBuyAmountAudio = quoteResult.outputAmount.amount
        }

        // console.log('Sending request to relay...')
        // // First call the solana relay method to initialize the coin metadata & set up transaction instructions
        const {
          createPoolTx: createPoolTxSerialized,
          firstBuyTx: firstBuyTxSerialized,
          metadataUri,
          mintPublicKey,
          imageUri
        } = await sdk.services.solanaRelay.launchCoin({
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          walletPublicKey,
          initialBuyAmountAudio,
          image: params.image
        })
        console.log('Relay response received', {
          createPoolTxSerialized,
          firstBuyTxSerialized,
          metadataUri,
          mintPublicKey
        })

        // // Deserialize the pool transaction
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

        if (!createPoolTxSignature) {
          // TODO: if we're here is this FUBAR...?
          throw new Error('No transaction signature to create pool transaction')
        }

        console.log('Creating coin in Audius database')
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

        // Create first buy
        // - First, swap requested amount of SOL to AUDIO
        // - Then, execute the first buy transaction with that newly swapped AUDIO
        // TODO: bundle these transactions into one
        if (
          firstBuyTxSerialized &&
          params.initialBuyAmountSol &&
          params.initialBuyAmountSol > 0 &&
          initialBuyQuoteResult
        ) {
          // TODO: check for issues here (e.g. initial buy amounts but no quote result, or no first buy tx)
          console.log('Performing initial SOL to AUDIO swap')
          await swapSolToAudio(
            initialBuyQuoteResult,
            params.initialBuyAmountSol,
            walletPublicKey,
            solanaProvider,
            sdk
          )

          // Deserialize the first buy transaction
          const firstBuyTx = VersionedTransaction.deserialize(
            Buffer.from(firstBuyTxSerialized, 'base64')
          )
          // Sign and send the first buy
          const firstBuyTxSignature =
            await solanaProvider.signAndSendTransaction(firstBuyTx)

          console.log('First Buy TX Signed', {
            firstBuyTxSignature
          })

          // Wait for confirmation
          await sdk.services.solanaClient.connection.confirmTransaction(
            createPoolTxSignature,
            'confirmed'
          )
        }

        return {
          newMint: mintPublicKey
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
