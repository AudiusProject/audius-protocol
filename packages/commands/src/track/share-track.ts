import chalk from 'chalk'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'
import { Command } from '@commander-js/extra-typings'

export const shareTrackCommand = new Command('share')
  .description('Share track')
  .argument('<trackId>', 'Id of the track to share')
  .option('-f, --from <from>', 'The account to share track from')
  .action(async (trackId, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })
    const userId = await getCurrentUserId()

    await audiusSdk.tracks.shareTrack({ userId, trackId })

    console.log(chalk.green('Successfully shared track'))

    process.exit(0)
  })
