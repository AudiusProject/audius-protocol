import chalk from 'chalk'
import { program, Option, Command } from '@commander-js/extra-typings'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { mintTo, getAccount } from '@solana/spl-token'

import { initializeAudiusSdk } from '../utils.js'

export const mintCommand = new Command('mint')
  .argument('<amount>', 'The amount of tokens to mint', (arg) => BigInt(arg))
  .description('Mint $AUDIO or $USDC tokens')
  .addOption(
    new Option('-m, --mint <mint>', 'The currency to mint for')
      .choices(['wAUDIO', 'USDC'] as const)
      .default('wAUDIO' as const)
  )
  .option('-f, --from <from>', 'The account to mint tokens for (handle)')
  .action(async (amount, { from, mint }) => {
    const audiusSdk = await initializeAudiusSdk({
      handle: from
    })

    const { userBank: splWallet } =
      await audiusSdk.services.claimableTokensClient.getOrCreateUserBank({
        mint
      })

    if (!process.env.SOLANA_ENDPOINT) {
      program.error('SOLANA_ENDPOINT environment variable not set')
    }

    const connection = new Connection(process.env.SOLANA_ENDPOINT)
    const feePayer = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.SOLANA_FEEPAYER_SECRET_KEY!))
    )
    const tokenMint =
      mint === 'wAUDIO'
        ? new PublicKey(process.env.SOLANA_TOKEN_MINT_PUBLIC_KEY!)
        : new PublicKey(process.env.SOLANA_USDC_TOKEN_MINT_PUBLIC_KEY!)
    const mintAuthority = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.SOLANA_OWNER_SECRET_KEY!))
    )

    try {
      const tx = await mintTo(
        connection,
        feePayer,
        tokenMint,
        splWallet,
        mintAuthority,
        amount
      )
      const accountInfo = await getAccount(connection, splWallet)
      console.log(chalk.green(`Successfully minted ${mint}`))
      console.log(chalk.yellow.bold('Transaction Signature:'), tx)
      console.log(
        chalk.yellow.bold('User bank address:    '),
        splWallet.toBase58()
      )
      console.log(
        chalk.yellow.bold('Balance:              '),
        accountInfo.amount.toString()
      )
    } catch (err) {
      program.error(`Failed to mint audio ${(err as Error).message}`)
    }

    process.exit(0)
  })
