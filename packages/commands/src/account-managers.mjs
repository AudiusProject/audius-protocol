import chalk from 'chalk'
import { program } from 'commander'

import { initializeAudiusSdk } from './utils.mjs'

program
  .command('add-manager')
  .description('Create a pending manager request for a user')
  .argument('[handle]', 'The handle of the manager')
  .option('-f, --from <from>', 'The account that will be managed')
  .action(async (handle, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })

    try {
      const {
        data: { id: userId }
      } = await audiusSdk.users.getUserByHandle({ handle: from })
      const {
        data: { id: managerUserId }
      } = await audiusSdk.users.getUserByHandle({ handle })

      await audiusSdk.grants.addManager({ userId, managerUserId })
      console.log(
        chalk.green(
          `Manager request created for ${handle}. Run audius-cmd approve-manager --from ${handle} ${from} to approve the request`
        )
      )
    } catch (err) {
      program.error(err.message)
    }

    process.exit(0)
  })

program
  .command('approve-manager-request')
  .description('Approve a pending manager request')
  .argument('[handle]', 'The handle of the user to be managed')
  .option('-f, --from <from>', 'The manager account handle')
  .action(async (handle, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })

    try {
      const {
        data: { id: userId }
      } = await audiusSdk.users.getUserByHandle({ handle: from })
      const {
        data: { id: grantorUserId }
      } = await audiusSdk.users.getUserByHandle({ handle })

      await audiusSdk.grants.approveGrant({ userId, grantorUserId })
      console.log(chalk.green(`Manager request approved!`))
    } catch (err) {
      program.error(err.message)
    }

    process.exit(0)
  })

program
  .command('reject-manager-request')
  .description('Reject a pending manager request')
  .argument('[handle]', 'The handle of the user to be managed')
  .option('-f, --from <from>', 'The manager account handle')
  .action(async (handle, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })

    try {
      const {
        data: { id: userId }
      } = await audiusSdk.users.getUserByHandle({ handle })
      const {
        data: { id: managerUserId }
      } = await audiusSdk.users.getUserByHandle({ handle: from })

      await audiusSdk.grants.removeManager({ userId, managerUserId })
      console.log(chalk.green(`Manager request rejected.`))
    } catch (err) {
      program.error(err.message)
    }

    process.exit(0)
  })

program
  .command('remove-manager')
  .description('Remove a manager')
  .argument('[handle]', 'The handle of the manager')
  .option('-f, --from <from>', 'The handle of the manager user')
  .action(async (handle, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })

    try {
      const {
        data: { id: userId }
      } = await audiusSdk.users.getUserByHandle({ handle: from })
      const {
        data: { id: managerUserId }
      } = await audiusSdk.users.getUserByHandle({ handle })

      await audiusSdk.grants.removeManager({ userId, managerUserId })
      console.log(chalk.green(`Manager removed.`))
    } catch (err) {
      program.error(err.message)
    }

    process.exit(0)
  })
