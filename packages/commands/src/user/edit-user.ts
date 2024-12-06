import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'

export const editUserCommand = new Command('edit')
  .description('Update an existing user')
  .argument('<handle>', "The user's handle (can't change)")
  .option('-n, --name <name>', "The user's new name")
  .option('-b, --bio <bio>', "The user's new bio")
  .option('-l, --location <location>', "The user's new location")
  .action(async (handle, { name, bio, location }) => {
    const audiusSdk = await initializeAudiusSdk({ handle })
    const userId = await getCurrentUserId()

    await audiusSdk.users.updateProfile({
      userId,
      metadata: { name, bio, location }
    })

    console.log(chalk.green('Successfully updated user!'))
  })
