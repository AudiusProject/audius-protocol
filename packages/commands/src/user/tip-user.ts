import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'

export const tipUserCommand = new Command('tip')
  .description('Tip $AUDIO to a user')
  .argument('<receiverUserId>', 'The user ID to tip tokens to')
  .argument('<amount>', 'The amount of tokens to tip (in wAUDIO)', parseFloat)
  .option('-f, --from <from>', 'The account to tip from')
  .action(async (receiverUserId, amount, { from }) => {
    const audiusSdk = await initializeAudiusSdk({
      handle: from
    })
    const senderUserId = await getCurrentUserId()

    const signature = await audiusSdk.users.sendTip({
      senderUserId,
      receiverUserId,
      amount
    })
    console.log(chalk.green('Successfully tipped audio'))
    console.log(chalk.yellow('Transaction Signature:'), signature)
  })
