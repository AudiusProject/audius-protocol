import chalk from 'chalk'
import { program, Option } from 'commander'

import { initializeAudiusLibs, initializeAudiusSdk } from './utils.mjs'

program
  .command('create-user-bank')
  .description('Create userbank for a user')
  .argument(
    '[handle]',
    'The handle for the user (or defaults to last logged in)'
  )
  .addOption(
    new Option('-m, --mint [mint]', 'The mint for which to make a user bank')
      .choices(['wAUDIO', 'USDC'])
      .default('wAUDIO')
  )
  .action(async (handle, { mint }) => {
    const audiusLibs = await initializeAudiusLibs(handle)

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

    try {
      const response =
        await audiusSdk.services.claimableTokensClient.getOrCreateUserBank({
          ethWallet: wallet.getAddressString(),
          mint
        })

      if (response.didExist) {
        console.log(chalk.green('Userbank already exists!'))
      } else {
        console.log(chalk.green('Successfully created userbank!'))
      }
      console.log(
        chalk.yellow.bold('User bank: '),
        response.userBank.toString()
      )
      console.log(chalk.yellow.bold('Mint:      '), mint)
    } catch (err) {
      program.error(chalk.red(err.message))
    }

    process.exit(0)
  })
