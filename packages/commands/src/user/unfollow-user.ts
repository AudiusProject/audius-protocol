import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'

export const unfollowUserCommand = new Command('unfollow')
  .description('Unfollow user')
  .argument('<followeeUserId>', 'The user id to unfollow')
  .option('-f, --from <from>', 'The account to unfollow from')
  .action(async (followeeUserId, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })
    const userId = await getCurrentUserId()

    await audiusSdk.users.unfollowUser({
      userId,
      followeeUserId
    })

    console.log(chalk.green('Successfully unfollowed user'))
  })
