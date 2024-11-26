import { program } from 'commander'

import { initializeAudiusSdk } from './utils.mjs'

program
  .command('tip-reaction')
  .description('Send a tip reaction')
  .argument('<handle>', 'users handle')
  .argument('<signature>', 'signature of the tip to react to')
  .action(async (handle, signature) => {
    const audiusSdk = await initializeAudiusSdk({
      handle: from
    })

    try {
      const {
        data: { id }
      } = await audiusSdk.users.getUserByHandle({ handle })
      await audiusSdk.users.sendTipReaction({
        userId: id,
        metadata: {
          reactedTo: signature,
          reactionValue: '🔥'
        }
      })
    } catch (err) {
      program.error(err.message)
    }
    process.exit(0)
  })
