import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'

export const unfavoritePlaylistCommand = new Command('unfavorite')
  .description('Unfavorite playlist')
  .argument('<playlistId>', 'Id of playlist to unfavorite')
  .option('-f, --from <from>', 'The account to unfavorite playlist from')
  .action(async (playlistId, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })
    const userId = await getCurrentUserId()

    await audiusSdk.playlists.favoritePlaylist({ userId, playlistId })
    console.log(chalk.green('Successfully unfavorited playlist'))
  })
