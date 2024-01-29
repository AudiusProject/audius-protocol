import { createJupiterApiClient, Instruction } from '@jup-ag/api'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'

import { Name } from 'models/Analytics'
import { CommonStoreContext } from 'store/storeContext'

/**
 * The error that gets returned if the slippage is exceeded
 * @see https://github.com/jup-ag/jupiter-cpi/blob/5eb897736d294767200302efd070b16343d8c618/idl.json#L2910-L2913
 * @see https://station.jup.ag/docs/additional-topics/troubleshooting#swap-execution
 */
export const SLIPPAGE_TOLERANCE_EXCEEDED_ERROR = 6001

export const parseJupiterInstruction = (instruction: Instruction) => {
  return new TransactionInstruction({
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((a) => ({
      pubkey: new PublicKey(a.pubkey),
      isSigner: a.isSigner,
      isWritable: a.isWritable
    })),
    data: Buffer.from(instruction.data, 'base64')
  })
}

export const jupiterInstance = createJupiterApiClient()

export const quoteWithAnalytics = async ({
  quoteArgs,
  track,
  make
}: {
  quoteArgs: Parameters<typeof jupiterInstance.quoteGet>[0]
  track: CommonStoreContext['analytics']['track']
  make: CommonStoreContext['analytics']['make']
}) => {
  await track(
    make({
      eventName: Name.JUPITER_QUOTE_REQUEST,
      inputMint: quoteArgs.inputMint,
      outputMint: quoteArgs.outputMint,
      swapMode: quoteArgs.swapMode,
      slippageBps: quoteArgs.slippageBps,
      amount: quoteArgs.amount
    })
  )
  const quoteResponse = await jupiterInstance.quoteGet(quoteArgs)
  await track(
    make({
      eventName: Name.JUPITER_QUOTE_RESPONSE,
      inputMint: quoteResponse.inputMint,
      outputMint: quoteResponse.outputMint,
      swapMode: quoteResponse.swapMode,
      slippageBps: quoteResponse.slippageBps,
      otherAmountThreshold: Number(quoteResponse.otherAmountThreshold),
      inAmount: Number(quoteResponse.inAmount),
      outAmount: Number(quoteResponse.outAmount)
    })
  )
  return quoteResponse
}
