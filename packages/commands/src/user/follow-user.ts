import chalk from 'chalk'
import { Command, program } from '@commander-js/extra-typings'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'

export const followUserCommand = new Command('follow')
  .description('Follow user')
  .argument('<followeeUserId>', 'The user id to follow')
  .option('-f, --from <from>', 'The account to follow from')
  .action(async (followeeUserId, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })
    const userId = await getCurrentUserId()

    try {
      await audiusSdk.users.followUser({
        userId,
        followeeUserId
      })

      console.log(chalk.green('Successfully followed user'))
    } catch (err) {
      program.error((err as Error).message)
    }

    process.exit(0)
  })
