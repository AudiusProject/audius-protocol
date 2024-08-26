import chalk from 'chalk'
import { program, Option } from 'commander'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { mintTo, getAccount } from '@solana/spl-token'

import { initializeAudiusLibs, initializeAudiusSdk } from './utils.mjs'

program
  .command('mint-tokens')
  .argument('<amount>', 'The amount of tokens to mint')
  .description('Mint $AUDIO or $USDC tokens')
  .addOption(
    new Option('-m, --mint [mint]', 'The currency to mint for')
      .choices(['wAUDIO', 'USDC'])
      .default('wAUDIO')
  )
  .option('-f, --from <from>', 'The account to mint tokens for (handle)')
  .action(async (amount, { from, mint }) => {
    const audiusLibs = await initializeAudiusLibs(from)

    // extract privkey and pubkey from hedgehog
    // only works with accounts created via audius-cmd
    const wallet = audiusLibs?.hedgehog?.getWallet()
    const privKey = wallet?.getPrivateKeyString()
    const pubKey = wallet?.getAddressString()

    // init sdk with priv and pub keys as api keys and secret
    // this enables writes via sdk
    const audiusSdk = await initializeAudiusSdk({
      apiKey: pubKey,
      apiSecret: privKey
    })

    const { userBank: splWallet } =
      await audiusSdk.services.claimableTokensClient.getOrCreateUserBank({
        ethWallet: wallet.getAddressString(),
        mint
      })

    if (!process.env.SOLANA_ENDPOINT) {
      program.error('SOLANA_ENDPOINT environment variable not set')
    }

    const connection = new Connection(process.env.SOLANA_ENDPOINT)
    const feePayer = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.SOLANA_FEEPAYER_SECRET_KEY))
    )
    const tokenMint =
      mint === 'wAUDIO'
        ? new PublicKey(process.env.SOLANA_TOKEN_MINT_PUBLIC_KEY)
        : new PublicKey(process.env.SOLANA_USDC_TOKEN_MINT_PUBLIC_KEY)
    const mintAuthority = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.SOLANA_OWNER_SECRET_KEY))
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
      console.log(chalk.yellow('Transaction Signature:'), tx)
      console.log(chalk.yellow('User bank address:    '), splWallet.toBase58())
      console.log(
        chalk.yellow('Balance:              '),
        accountInfo.amount.toString()
      )
    } catch (err) {
      program.error(`Failed to mint audio ${err.message}`)
    }

    process.exit(0)
  })
