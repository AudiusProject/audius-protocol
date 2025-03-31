import { Command } from '@commander-js/extra-typings'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'

export const tipReactionCommand = new Command('tip-reaction')
  .description('Send a tip reaction')
  .argument('<signature>', 'signature of the tip to react to')
  .option('-f, --from <from>', 'The account to react from')
  .action(async (signature, { from }) => {
    const audiusSdk = await initializeAudiusSdk({
      handle: from
    })
    const userId = await getCurrentUserId()

    await audiusSdk.users.sendTipReaction({
      userId,
      metadata: {
        reactedTo: signature,
        reactionValue: '🔥'
      }
    })
  })
