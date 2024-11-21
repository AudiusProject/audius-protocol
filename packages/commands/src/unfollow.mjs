import chalk from 'chalk'
import { program } from 'commander'

import { initializeAudiusLibs } from './utils.mjs'

program
  .command('unfollow')
  .description('Unfollow user')
  .argument('<userId>', 'The user id to unfollow', Number)
  .option('-f, --from <from>', 'The account to unfollow from')
  .action(async (userId, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from)

    try {
      const response = await audiusLibs.EntityManager.unfollowUser(userId)

      if (response.error) {
        program.error(chalk.red(response.error))
      }
      console.log(chalk.green('Successfully unfollowed user'))
    } catch (err) {
      program.error(err.message)
    }

    process.exit(0)
  })
