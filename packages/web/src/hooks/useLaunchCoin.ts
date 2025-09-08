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
  logoUri: string
}

const relayResponse = {
  mintPublicKey: 'VuCS5rmXUK48d2Qctk4tCJKJMY7fPjp6EjsJCYzsc4R',
  imageUri:
    'https://gateway.irys.xyz/5QSH5iKSymsbXYnxHhYwpfERjFvV864LTQSiwQPzyNJe',
  createPoolTx: {
    type: 'Buffer',
    data: [
      2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 117, 7, 189, 3, 76, 37, 41,
      22, 42, 205, 29, 116, 71, 10, 131, 58, 90, 251, 29, 224, 24, 19, 73, 101,
      151, 206, 52, 218, 184, 15, 133, 154, 176, 138, 126, 64, 133, 42, 91, 35,
      107, 27, 194, 1, 116, 84, 185, 155, 241, 72, 38, 115, 204, 169, 167, 217,
      58, 226, 175, 158, 129, 23, 186, 10, 2, 0, 8, 14, 218, 148, 167, 245, 181,
      20, 155, 212, 178, 109, 101, 245, 208, 187, 56, 10, 74, 190, 136, 12, 131,
      58, 144, 213, 68, 55, 176, 36, 126, 142, 17, 253, 7, 103, 72, 56, 200,
      191, 200, 161, 94, 52, 132, 166, 179, 130, 18, 190, 212, 204, 223, 62, 87,
      71, 149, 140, 75, 169, 75, 183, 132, 2, 232, 178, 201, 24, 121, 254, 234,
      86, 20, 34, 29, 53, 131, 171, 95, 210, 174, 15, 232, 43, 145, 198, 81,
      166, 77, 33, 213, 4, 45, 172, 68, 69, 133, 133, 208, 233, 167, 76, 161,
      124, 119, 169, 218, 235, 114, 161, 216, 51, 104, 67, 115, 147, 7, 135,
      157, 178, 145, 76, 111, 127, 193, 53, 168, 80, 16, 61, 213, 146, 55, 117,
      206, 180, 171, 71, 249, 149, 235, 203, 88, 188, 88, 236, 115, 20, 203,
      223, 133, 51, 251, 17, 160, 253, 4, 165, 66, 116, 21, 95, 236, 219, 159,
      153, 68, 101, 91, 110, 64, 226, 185, 135, 83, 153, 21, 195, 70, 234, 247,
      244, 6, 25, 153, 192, 181, 171, 247, 69, 130, 213, 184, 244, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 27, 212, 220, 214, 56, 12, 36, 44, 142, 95, 91, 228, 177, 149,
      197, 83, 114, 24, 166, 20, 116, 162, 135, 88, 210, 201, 81, 177, 218, 20,
      118, 2, 108, 214, 204, 128, 199, 176, 11, 36, 194, 16, 32, 56, 67, 63, 72,
      170, 15, 202, 142, 231, 232, 25, 3, 60, 15, 225, 251, 167, 40, 223, 245,
      12, 123, 252, 51, 204, 46, 117, 193, 72, 118, 204, 55, 146, 131, 144, 79,
      73, 7, 118, 105, 17, 34, 87, 187, 58, 223, 243, 105, 139, 96, 34, 73, 64,
      9, 96, 12, 165, 36, 247, 177, 183, 214, 204, 177, 195, 151, 58, 160, 51,
      13, 25, 3, 218, 96, 28, 201, 181, 222, 227, 198, 98, 180, 202, 209, 73,
      218, 99, 104, 31, 114, 134, 188, 200, 6, 113, 158, 44, 43, 80, 162, 1, 87,
      36, 59, 252, 150, 104, 177, 21, 32, 188, 83, 132, 62, 220, 219, 8, 11,
      112, 101, 177, 227, 209, 124, 69, 56, 157, 82, 127, 107, 4, 195, 205, 88,
      184, 108, 115, 26, 160, 253, 181, 73, 182, 209, 188, 3, 248, 41, 70, 6,
      221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172,
      28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169,
      79, 102, 145, 140, 179, 132, 225, 40, 164, 124, 205, 117, 102, 174, 59,
      77, 96, 116, 182, 236, 130, 136, 191, 14, 95, 247, 141, 14, 164, 207, 73,
      57, 1, 10, 16, 7, 11, 0, 1, 9, 5, 4, 2, 3, 12, 0, 13, 13, 6, 8, 10, 111,
      140, 85, 215, 176, 102, 54, 104, 79, 15, 0, 0, 0, 70, 114, 111, 103, 32,
      68, 101, 112, 97, 114, 116, 109, 101, 110, 116, 7, 0, 0, 0, 70, 82, 79,
      71, 68, 69, 80, 69, 0, 0, 0, 104, 116, 116, 112, 115, 58, 47, 47, 103, 97,
      116, 101, 119, 97, 121, 46, 105, 114, 121, 115, 46, 120, 121, 122, 47, 70,
      101, 50, 70, 115, 89, 87, 53, 106, 122, 106, 115, 74, 51, 103, 52, 118,
      89, 101, 109, 80, 68, 109, 120, 80, 54, 82, 82, 56, 68, 57, 52, 115, 117,
      53, 97, 69, 106, 84, 114, 68, 112, 55, 85
    ]
  },
  firstBuyTx: {
    type: 'Buffer',
    data: [
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 9, 15, 218, 148, 167,
      245, 181, 20, 155, 212, 178, 109, 101, 245, 208, 187, 56, 10, 74, 190,
      136, 12, 131, 58, 144, 213, 68, 55, 176, 36, 126, 142, 17, 253, 68, 42,
      106, 161, 221, 247, 16, 221, 188, 4, 113, 34, 54, 4, 194, 72, 147, 233,
      50, 252, 91, 226, 191, 17, 12, 165, 44, 213, 136, 209, 255, 234, 150, 61,
      149, 126, 191, 208, 1, 238, 184, 231, 187, 19, 58, 108, 58, 183, 113, 224,
      95, 42, 15, 14, 51, 64, 210, 221, 111, 17, 51, 170, 76, 154, 201, 24, 121,
      254, 234, 86, 20, 34, 29, 53, 131, 171, 95, 210, 174, 15, 232, 43, 145,
      198, 81, 166, 77, 33, 213, 4, 45, 172, 68, 69, 133, 133, 213, 146, 55,
      117, 206, 180, 171, 71, 249, 149, 235, 203, 88, 188, 88, 236, 115, 20,
      203, 223, 133, 51, 251, 17, 160, 253, 4, 165, 66, 116, 21, 95, 236, 219,
      159, 153, 68, 101, 91, 110, 64, 226, 185, 135, 83, 153, 21, 195, 70, 234,
      247, 244, 6, 25, 153, 192, 181, 171, 247, 69, 130, 213, 184, 244, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 27, 212, 220, 214, 56, 12, 36, 44, 142, 95, 91, 228, 177, 149,
      197, 83, 114, 24, 166, 20, 116, 162, 135, 88, 210, 201, 81, 177, 218, 20,
      118, 2, 108, 214, 204, 128, 199, 176, 11, 36, 194, 16, 32, 56, 67, 63, 72,
      170, 15, 202, 142, 231, 232, 25, 3, 60, 15, 225, 251, 167, 40, 223, 245,
      12, 123, 252, 51, 204, 46, 117, 193, 72, 118, 204, 55, 146, 131, 144, 79,
      73, 7, 118, 105, 17, 34, 87, 187, 58, 223, 243, 105, 139, 96, 34, 73, 64,
      140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131,
      11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89,
      9, 96, 12, 165, 36, 247, 177, 183, 214, 204, 177, 195, 151, 58, 160, 51,
      13, 25, 3, 218, 96, 28, 201, 181, 222, 227, 198, 98, 180, 202, 209, 73,
      218, 99, 104, 31, 114, 134, 188, 200, 6, 113, 158, 44, 43, 80, 162, 1, 87,
      36, 59, 252, 150, 104, 177, 21, 32, 188, 83, 132, 62, 220, 219, 8, 6, 221,
      246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28,
      180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169, 7,
      103, 72, 56, 200, 191, 200, 161, 94, 52, 132, 166, 179, 130, 18, 190, 212,
      204, 223, 62, 87, 71, 149, 140, 75, 169, 75, 183, 132, 2, 232, 178, 79,
      102, 145, 140, 179, 132, 225, 40, 164, 124, 205, 117, 102, 174, 59, 77,
      96, 116, 182, 236, 130, 136, 191, 14, 95, 247, 141, 14, 164, 207, 73, 57,
      2, 10, 6, 0, 2, 0, 14, 6, 13, 1, 1, 11, 15, 12, 7, 5, 1, 2, 4, 3, 14, 9,
      0, 13, 13, 11, 8, 11, 24, 248, 198, 158, 145, 225, 117, 135, 200, 213,
      195, 179, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ]
  },
  metadataUri:
    'https://gateway.irys.xyz/Fe2FsYW5jzjsJ3g4vYemPDmxP6RR8D94su5aEjTrDp7U'
}

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

        const getInitialBuyQuote = async () => {
          let initialBuyAmountAudio: number | undefined
          let initialBuyQuoteResult: JupiterQuoteResult | undefined
          // Get a quote for SOL -> AUDIO - use this as the amount we intend to first buy
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
            return {
              initialBuyQuoteResult: quoteResult,
              initialBuyAmountAudio: quoteResult.outputAmount.amount
            }
          }
        }
        // Helper function to swap SOL to AUDIO using appkitModal provider
        const performInitialBuySwap = async (
          firstBuyTx: VersionedTransaction,
          quote: JupiterQuoteResult,
          walletPublicKey: PublicKey
        ): Promise<void> => {
          // Extract instructions from the original firstBuyTx
          const originalInstructions =
            await sdk.services.solanaClient.getInstructions(firstBuyTx)

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

          // Build new instructions array by combining original and new instructions
          const instructions: TransactionInstruction[] = []
          // Add first original instruction
          if (originalInstructions.length > 0) {
            instructions.push(originalInstructions[0])
          }

          console.log(quote)
          // Add Jupiter swap instructions
          const { swapInstructionsResult } = await getJupiterSwapInstructions(
            swapRequestParams,
            outputTokenConfig,
            walletPublicKey,
            walletPublicKey, // feePayer is the wallet itself
            instructions
          )
          console.log(swapInstructionsResult)

          const { swapInstruction, addressLookupTableAddresses } =
            swapInstructionsResult
          const jupiterInstructions = convertJupiterInstructions([
            swapInstruction
          ])
          instructions.push(...jupiterInstructions)

          // Add remaining original instructions
          if (originalInstructions.length > 1) {
            for (let i = 1; i < originalInstructions.length; i++) {
              instructions.push(originalInstructions[i])
            }
          }

          // Build transaction with all combined instructions
          const swapTx = await sdk.services.solanaClient.buildTransaction({
            feePayer: walletPublicKey,
            instructions,
            addressLookupTables: addressLookupTableAddresses
              ? addressLookupTableAddresses.map(
                  (addr: string) => new PublicKey(addr)
                )
              : undefined
          })

          console.log(
            'Built combined transaction with firstBuyTx + AUDIO ATA + Jupiter swap',
            swapTx
          )

          console.log(
            ' base64 version of swap tx',
            Buffer.from(swapTx.serialize()).toString('base64')
          )

          // Sign and send with appkitModal provider
          const signature = await solanaProvider.signAndSendTransaction(swapTx)

          console.log('Combined transaction signed and sent', signature)

          // Confirm transaction
          await sdk.services.solanaClient.connection.confirmTransaction(
            signature,
            'confirmed'
          )

          console.log('Combined transaction confirmed')
        }

        const signAndCreatePoolTx = async () => {
          // // Deserialize the pool transaction
          const createPoolTx = VersionedTransaction.deserialize(
            Buffer.from(createPoolTxSerialized, 'base64')
          )

          console.log(
            'Pool TX Deserialized! Sending transaction to user to sign'
          )

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
          return createPoolTxSignature
        }

        const walletPublicKey = new PublicKey(params.walletPublicKey)

        console.log('Sending request to relay to launch coin...')
        // Get quote
        const quoteRes = await getInitialBuyQuote()
        const { initialBuyQuoteResult, initialBuyAmountAudio } = quoteRes ?? {}
        // Set up coin TXs on relay side
        // const {
        //   createPoolTx: createPoolTxSerialized,
        //   firstBuyTx: firstBuyTxSerialized,
        //   metadataUri,
        //   mintPublicKey,
        //   imageUri
        // } = await sdk.services.solanaRelay.launchCoin({
        //   name: params.name,
        //   symbol: params.symbol,
        //   description: params.description,
        //   walletPublicKey,
        //   initialBuyAmountAudio,
        //   image: params.image
        // })

        const {
          createPoolTx: createPoolTxSerialized,
          firstBuyTx: firstBuyTxSerialized,
          metadataUri,
          mintPublicKey,
          imageUri
        } = relayResponse

        console.log('Relay response received!', {
          createPoolTxSerialized,
          firstBuyTxSerialized,
          metadataUri,
          mintPublicKey
        })

        // Sign pool tx
        // const createPoolTxSignature = await signAndCreatePoolTx()

        // if (!createPoolTxSignature) {
        //   // TODO: if we're here is this FUBAR...?
        //   throw new Error('No transaction signature to create pool transaction')
        // }

        // Create coin in Audius database
        console.log('Creating coin in Audius database')
        // const coinRes = await sdk.coins.createCoin({
        //   userId: Id.parse(params.userId),
        //   createCoinRequest: {
        //     mint: mintPublicKey,
        //     ticker: `$${params.symbol}`,
        //     decimals: 9,
        //     name: params.name,
        //     logoUri: imageUri
        //   }
        // })
        // console.log('Coin added to Audius database', coinRes)

        // Perform first buy
        if (
          firstBuyTxSerialized &&
          params.initialBuyAmountSol &&
          params.initialBuyAmountSol > 0 &&
          initialBuyQuoteResult
        ) {
          const firstBuyTx = VersionedTransaction.deserialize(
            Buffer.from(firstBuyTxSerialized, 'base64')
          )
          await swapSolToAudio(
            initialBuyQuoteResult!,
            params.initialBuyAmountSol,
            walletPublicKey,
            solanaProvider,
            sdk
          )
          // await performInitialBuySwap(
          //   firstBuyTx,
          //   initialBuyQuoteResult!,
          //   walletPublicKey
          // )
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
