import chalk from 'chalk'
import { program } from 'commander'

import { getCurrentAudiusSdkUser, initializeAudiusSdk } from './utils.mjs'
import { Utils } from '@audius/sdk-legacy/dist/libs.js'

program
  .command('tip-audio')
  .description('Send a tip')
  .argument('<userId>', 'The user ID to tip tokens to')
  .argument('<amount>', 'The amount of tokens to tip (in wAUDIO)', parseFloat)
  .option('-f, --from [from]', 'The account to tip from')
  .action(async (userId, amount, { from }) => {
    const audiusSdk = await initializeAudiusSdk({
      handle: from
    })
    const currentUser = await getCurrentAudiusSdkUser()

    try {
      const res = await audiusSdk.users.sendTip({
        senderUserId: currentUser.id,
        receiverUserId: Utils.encodeHashId(userId),
        amount
      })
      console.log(chalk.green('Successfully tipped audio'))
      console.log(chalk.yellow('Transaction Signature:'), res)
    } catch (err) {
      if ('response' in err) {
        console.log(
          chalk.red('Request ID:'),
          err.response.headers.get('x-request-id')
        )
        console.log(chalk.red('Response JSON:'), await err.response.json())
      }
      program.error(err.message)
    }

    process.exit(0)
  })
