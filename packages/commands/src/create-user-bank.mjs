import chalk from 'chalk'
import { program, Option } from 'commander'

import { initializeAudiusSdk } from './utils.mjs'

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
    const audiusSdk = await initializeAudiusSdk({ handle })

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
