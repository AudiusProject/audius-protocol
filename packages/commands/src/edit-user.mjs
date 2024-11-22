import chalk from 'chalk'
import { program } from 'commander'

import { getCurrentAudiusSdkUser, initializeAudiusSdk } from './utils.mjs'

program
  .command('edit-user')
  .description('Update an existing user')
  .argument('<handle>', "The user's handle (can't change)")
  .option('-n, --name <name>', "The user's new name")
  .option('-b, --bio <bio>', "The user's new bio")
  .option('-l, --location <location>', "The user's new location")
  .action(async (handle, { name, bio, location }) => {
    const audiusSdk = await initializeAudiusSdk({ handle })
    const user = await getCurrentAudiusSdkUser()
    const { id: userId } = user

    console.log(chalk.yellow.bold('User before update: '), user)

    try {
      const response = await audiusSdk.users.updateProfile({
        userId,
        metadata: { name, bio, location }
      })

      if (response.error) {
        program.error(chalk.red(response.error))
      }

      const updatedUser = await audiusSdk.full.users.getUser({
        id: userId,
        userId
      })
      console.log(chalk.green('Successfully updated user!'))
      console.log(chalk.yellow.bold('User after update: '), updatedUser)
    } catch (err) {
      console.error(err)
      program.error(err.message)
    }

    process.exit(0)
  })
