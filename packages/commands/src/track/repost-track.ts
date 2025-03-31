import chalk from 'chalk'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'
import { Command } from '@commander-js/extra-typings'

export const repostTrackCommand = new Command('repost')
  .description('Repost track')
  .argument('<trackId>', 'Id of the track to repost')
  .option('-f, --from <from>', 'The account to repost track from')
  .action(async (trackId, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })
    const userId = await getCurrentUserId()

    await audiusSdk.tracks.repostTrack({ userId, trackId })

    console.log(chalk.green('Successfully reposted track'))

    process.exit(0)
  })
