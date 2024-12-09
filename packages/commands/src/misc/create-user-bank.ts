import chalk from 'chalk'
import { Command, Option } from '@commander-js/extra-typings'

import { initializeAudiusSdk } from '../utils.js'

export const createUserBankCommand = new Command('create-user-bank')
  .description('Create userbank for a user')
  .argument(
    '[handle]',
    'The handle for the user (or defaults to last logged in)'
  )
  .addOption(
    new Option('--mint <mint>', 'The mint for which to make a user bank')
      .choices(['wAUDIO', 'USDC'] as const)
      .default('wAUDIO' as const)
  )
  .action(async (handle, { mint }) => {
    const audiusSdk = await initializeAudiusSdk({ handle })

    const response =
      await audiusSdk.services.claimableTokensClient.getOrCreateUserBank({
        mint
      })

    if (response.didExist) {
      console.log(chalk.green('Userbank already exists!'))
    } else {
      console.log(chalk.green('Successfully created userbank!'))
    }
    console.log(chalk.yellow.bold('User bank: '), response.userBank.toString())
    console.log(chalk.yellow.bold('Mint:      '), mint)
  })
