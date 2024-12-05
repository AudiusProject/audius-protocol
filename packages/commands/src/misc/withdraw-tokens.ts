import { Connection, Keypair, TransactionInstruction } from '@solana/web3.js'
import chalk from 'chalk'
import { Option, Command } from '@commander-js/extra-typings'

import { initializeAudiusSdk } from '../utils.js'

import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'

export const withdrawTokensCommand = new Command('withdraw-tokens')
  .description('Send tokens from a user bank to an external address')
  .argument('<account>', 'The solana address of the recipient')
  .argument('<amount>', 'The amount of tokens to send (in wei)', (arg) =>
    BigInt(arg)
  )
  .addOption(
    new Option('-m, --mint <mint>', 'The currency to use')
      .choices(['wAUDIO', 'USDC'] as const)
      .default('USDC' as const)
  )
  .option('-f, --from <from>', 'The account to send from')
  .action(async (recipientAccount, amount, { from, mint }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })

    if (!process.env.SOLANA_ENDPOINT) {
      throw new Error('SOLANA_ENDPOINT environment variable not set')
    }

    const connection = new Connection(process.env.SOLANA_ENDPOINT)
    const feePayer = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.SOLANA_FEEPAYER_SECRET_KEY!))
    )

    const tokenMint =
      mint === 'wAUDIO'
        ? new PublicKey(process.env.SOLANA_TOKEN_MINT_PUBLIC_KEY!)
        : new PublicKey(process.env.SOLANA_USDC_TOKEN_MINT_PUBLIC_KEY!)

    const destinationWallet = new PublicKey(recipientAccount)

    const { userBank: userbankPublicKey } =
      await audiusSdk.services.claimableTokensClient.getOrCreateUserBank({
        mint
      })

    const destination = getAssociatedTokenAddressSync(
      tokenMint,
      destinationWallet
    )

    const instructions: TransactionInstruction[] = []
    try {
      await getAccount(connection, destination)
    } catch (e) {
      console.debug(
        `Associated token account ${destination.toBase58()} does not exist. Creating w/ transfer...`
      )

      const payerKey = await audiusSdk.services.solanaRelay.getFeePayer()
      const createAtaInstruction =
        createAssociatedTokenAccountIdempotentInstruction(
          payerKey,
          destination,
          destinationWallet,
          tokenMint
        )
      instructions.push(createAtaInstruction)
    }

    const secpTransferInstruction =
      await audiusSdk.services.claimableTokensClient.createTransferSecpInstruction(
        {
          amount,
          mint,
          destination,
          instructionIndex: instructions.length
        }
      )
    instructions.push(secpTransferInstruction)

    const transferInstruction =
      await audiusSdk.services.claimableTokensClient.createTransferInstruction({
        mint,
        destination
      })
    instructions.push(transferInstruction)

    const transaction = await audiusSdk.services.solanaClient.buildTransaction({
      instructions
    })

    const signature =
      await audiusSdk.services.claimableTokensClient.sendTransaction(
        transaction
      )
    console.log(chalk.green('Successfully withdrew USDC'))
    console.log(chalk.yellow('Transaction Signature:'), signature)
  })
