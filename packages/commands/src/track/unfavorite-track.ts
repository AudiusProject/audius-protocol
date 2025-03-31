import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'

export const unfavoriteTrackCommand = new Command('unfavorite')
  .description('Unfavorite track')
  .argument('<trackId>', 'Id of the track to unfavorite')
  .option('-f, --from <from>', 'The account to unfavorite track from')
  .action(async (trackId, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })
    const userId = await getCurrentUserId()

    await audiusSdk.tracks.unfavoriteTrack({
      userId,
      trackId
    })
    console.log(chalk.green('Successfully unfavorited track'))
  })
