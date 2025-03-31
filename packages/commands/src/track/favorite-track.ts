import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'

export const favoriteTrackCommand = new Command('favorite')
  .description('Favorite track')
  .argument('<trackId>', 'Id of the track to favorite')
  .option('-f, --from <from>', 'The account to favorite track from')
  .action(async (trackId, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })
    const userId = await getCurrentUserId()

    await audiusSdk.tracks.favoriteTrack({
      userId,
      trackId
    })
    console.log(chalk.green('Successfully favorited track'))
  })
