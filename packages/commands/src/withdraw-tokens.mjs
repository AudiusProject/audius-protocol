import { Connection, Keypair } from '@solana/web3.js'
import BN from 'bn.js'
import chalk from 'chalk'
import { program, Option } from 'commander'

import { initializeAudiusLibs } from './utils.mjs'

import { createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import {
  Transaction,
  sendAndConfirmTransaction,
  PublicKey
} from '@solana/web3.js'

program
  .command('withdraw-tokens')
  .description('Send USDC from a user bank to an external address')
  .argument('<account>', 'The solana address of the recipient')
  .argument('<amount>', 'The amount of tokens to tip (in wei)')
  .addOption(
    new Option('-m, --mint [mint]', 'The currency to use')
      .choices(['audio', 'usdc'])
      .default('usdc')
  )
  .option('-f, --from [from]', 'The account to tip from')
  .action(async (recipientAccount, amount, { from, mint }) => {
    const audiusLibs = await initializeAudiusLibs(from)
    const { solanaWeb3Manager } = audiusLibs

    if (!process.env.SOLANA_ENDPOINT) {
      program.error('SOLANA_ENDPOINT environment variable not set')
    }

    const connection = new Connection(process.env.SOLANA_ENDPOINT)
    const feePayer = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.SOLANA_FEEPAYER_SECRET_KEY))
    )

    const tokenMint =
      mint === 'audio'
        ? new PublicKey(process.env.SOLANA_TOKEN_MINT_PUBLIC_KEY)
        : new PublicKey(process.env.SOLANA_USDC_TOKEN_MINT_PUBLIC_KEY)

    const recipientAccountPublicKey = new PublicKey(recipientAccount)

    const { userbank: userbankPublicKey } =
      await solanaWeb3Manager.createUserBankIfNeeded({
        mint
      })

    try {
      console.log('checking for recipient usdc account...')
      const recipientTokenAccount =
        await solanaWeb3Manager.findAssociatedTokenAddress(
          recipientAccountPublicKey.toString(),
          mint
        )
      let recipientTokenAccountInfo =
        await solanaWeb3Manager.getTokenAccountInfo(
          recipientTokenAccount.toString()
        )

      // If it's not a valid token account, we need to make one first
      if (!recipientTokenAccountInfo) {
        console.log(
          'Provided recipient solana address has no associated token account, creating'
        )
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash()
        const accountCreationTx = new Transaction({
          blockhash,
          lastValidBlockHeight
        })
        const createTokenAccountInstruction =
          createAssociatedTokenAccountInstruction(
            feePayer.publicKey, // fee payer
            recipientTokenAccount, // account to create
            recipientAccountPublicKey, // owner
            tokenMint // mint
          )
        accountCreationTx.add(createTokenAccountInstruction)

        const accountCreationTxSignature = await sendAndConfirmTransaction(
          connection,
          accountCreationTx,
          [feePayer],
          {
            skipPreflight: true
          }
        )
        console.log(chalk.green(`Successfully created new ${mint} account`))
        console.log(
          chalk.yellow('Transaction Signature:'),
          accountCreationTxSignature
        )

        recipientTokenAccountInfo = await solanaWeb3Manager.getTokenAccountInfo(
          recipientTokenAccount.toString()
        )
      }

      console.log('transferring USDC to recipient...')
      const instructions =
        await audiusLibs.solanaWeb3Manager.createTransferInstructionsFromCurrentUser(
          {
            amount: new BN(amount),
            feePayerKey: feePayer.publicKey,
            senderSolanaAddress: userbankPublicKey,
            recipientSolanaAddress: recipientTokenAccount,
            mint
          }
        )

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash()
      const transferTx = new Transaction({
        blockhash,
        feePayer: feePayer.publicKey,
        lastValidBlockHeight
      })
      transferTx.add(...instructions)
      const tx = await sendAndConfirmTransaction(connection, transferTx, [
        feePayer
      ])

      console.log(chalk.green('Successfully withdrew USDC'))
      console.log(chalk.yellow('Transaction Signature:'), tx)
    } catch (err) {
      program.error(err)
    }

    process.exit(0)
  })
