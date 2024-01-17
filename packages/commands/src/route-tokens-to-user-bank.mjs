import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  mintTo
} from '@solana/spl-token'
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction
} from '@solana/web3.js'
import chalk from 'chalk'
import { Option, program } from 'commander'

import { route } from '@audius/spl'

import { initializeAudiusLibs } from './utils.mjs'

const TOKEN_DECIMALS = {
  audio: 8,
  usdc: 6
}

const MEMO_PROGRAM_ID = new PublicKey(
  'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'
)

program
  .command('route-tokens-to-user-bank')
  .argument('<amount>', 'The amount of tokens to send')
  .description(
    'Transfer $USDC or $AUDIO tokens using payment router into a user bank from the owner wallet'
  )
  .addOption(
    new Option('-m, --mint [mint]', 'The currency to use')
      .choices(['audio', 'usdc'])
      .default('usdc')
  )
  .option('-f, --from <from>', 'The account to send tokens to (handle)')
  .option('--memo <memo>', 'A data string to attach as a memo')
  .action(async (amountInput, { from, mint, memo }) => {
    const amount = BigInt(amountInput)
    const audiusLibs = await initializeAudiusLibs(from)
    const { solanaWeb3Manager } = audiusLibs

    const { userbank: userbankPublicKey } =
      await solanaWeb3Manager.createUserBankIfNeeded({
        mint
      })

    if (!process.env.SOLANA_ENDPOINT) {
      program.error('SOLANA_ENDPOINT environment variable not set')
    }

    const connection = new Connection(process.env.SOLANA_ENDPOINT)
    const feePayer = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.SOLANA_FEEPAYER_SECRET_KEY))
    )

    const paymentRouterPublicKey = new PublicKey(
      process.env.SOLANA_PAYMENT_ROUTER_PUBLIC_KEY
    )

    const tokenMint =
      mint === 'audio'
        ? new PublicKey(process.env.SOLANA_TOKEN_MINT_PUBLIC_KEY)
        : new PublicKey(process.env.SOLANA_USDC_TOKEN_MINT_PUBLIC_KEY)

    const senderAccountKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.SOLANA_OWNER_SECRET_KEY))
    )
    const senderAccountPublicKey = senderAccountKeypair.publicKey

    try {
      console.log('checking for source usdc account')
      const senderTokenAccount =
        await solanaWeb3Manager.findAssociatedTokenAddress(
          senderAccountPublicKey.toString(),
          mint
        )
      let senderTokenAccountInfo = await solanaWeb3Manager.getTokenAccountInfo(
        senderTokenAccount.toString()
      )

      // If it's not a valid token account, we need to make one first
      if (!senderTokenAccountInfo) {
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
            senderAccountPublicKey, // fee payer
            senderTokenAccount, // account to create
            senderAccountPublicKey, // owner
            tokenMint // mint
          )
        accountCreationTx.add(createTokenAccountInstruction)

        const accountCreationTxSignature = await sendAndConfirmTransaction(
          connection,
          accountCreationTx,
          [senderAccountKeypair],
          {
            skipPreflight: true
          }
        )
        console.log(chalk.green(`Successfully created new ${mint} account`))
        console.log(
          chalk.yellow('Transaction Signature:'),
          accountCreationTxSignature
        )

        senderTokenAccountInfo = await solanaWeb3Manager.getTokenAccountInfo(
          senderTokenAccount.toString()
        )
      }

      if (senderTokenAccountInfo.amount < amount) {
        console.log('Source account has insufficient funds, minting...')
        // Fund source wallet first
        const fundingTxSignature = await mintTo(
          connection,
          feePayer,
          tokenMint,
          senderTokenAccount,
          senderAccountKeypair,
          amount
        )
        console.log(
          chalk.green(`Successfully minted ${mint} to source account`)
        )
        console.log(chalk.yellow('Transaction Signature:'), fundingTxSignature)
      } else {
        console.log(
          `Souce account has sufficient funds (${senderTokenAccountInfo.amount})`
        )
      }

      // Transfer into user bank
      console.info('Transferring from source account to user bank...')

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash()
      const transferTx = new Transaction({
        blockhash,
        lastValidBlockHeight
      })

      const [paymentRouterPda, paymentRouterPdaBump] =
        PublicKey.findProgramAddressSync(
          [Buffer.from('payment_router')],
          paymentRouterPublicKey
        )

      // Associated token account owned by the PDA
      const paymentRouterTokenAccount =
        await solanaWeb3Manager.findAssociatedTokenAddress(
          paymentRouterPda.toString(),
          mint
        )
      const paymentRouterTokenAccountInfo =
        solanaWeb3Manager.getTokenAccountInfo(
          paymentRouterTokenAccount.toString()
        )
      if (paymentRouterTokenAccountInfo === null) {
        throw new Error(
          'Payment Router balance PDA token account does not exist'
        )
      }

      const transferInstruction = createTransferCheckedInstruction(
        senderTokenAccount,
        tokenMint,
        paymentRouterTokenAccount,
        senderAccountPublicKey,
        amount,
        TOKEN_DECIMALS[mint]
      )

      const paymentRouterInstruction = await route(
        paymentRouterTokenAccount,
        paymentRouterPda,
        paymentRouterPdaBump,
        [userbankPublicKey], // recipients
        [amount],
        amount,
        TOKEN_PROGRAM_ID,
        paymentRouterPublicKey
      )

      transferTx.add(transferInstruction, paymentRouterInstruction)

      if (memo) {
        transferTx.add(
          new TransactionInstruction({
            keys: [
              {
                pubkey: senderAccountPublicKey,
                isSigner: true,
                isWritable: true
              }
            ],
            programId: MEMO_PROGRAM_ID,
            data: Buffer.from(memo)
          })
        )
      }

      const transferTxSignature = await sendAndConfirmTransaction(
        connection,
        transferTx,
        [senderAccountKeypair],
        {
          skipPreflight: true
        }
      )

      console.log(
        chalk.green(`Successfully transferred ${mint} to dest account`)
      )
      console.log(chalk.yellow('Transaction Signature:'), transferTxSignature)

      const accountInfo = await getAccount(connection, userbankPublicKey)

      console.log(
        chalk.yellow('User bank address:    '),
        userbankPublicKey.toBase58()
      )
      console.log(
        chalk.yellow('Balance:              '),
        accountInfo.amount.toString()
      )
    } catch (err) {
      console.error(err)
      program.error(`Failed to transfer tokens ${err.message}`)
    }

    process.exit(0)
  })
