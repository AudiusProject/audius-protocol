import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'

export const sharePlaylistCommand = new Command('share')
  .description('Share playlist')
  .argument('<playlistId>', 'Id of playlist to share')
  .option('-f, --from <from>', 'The account to share playlist from')
  .action(async (playlistId, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })
    const userId = await getCurrentUserId()

    await audiusSdk.playlists.sharePlaylist({ userId, playlistId })
    console.log(chalk.green('Successfully shared playlist'))
  })
