import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'

export const unrepostPlaylistCommand = new Command('unrepost')
  .description('Unrepost playlist')
  .argument('<playlistId>', 'Id of playlist to repost')
  .option('-f, --from <from>', 'The account to repost playlist from')
  .action(async (playlistId, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })
    const userId = await getCurrentUserId()

    await audiusSdk.playlists.unrepostPlaylist({
      userId,
      playlistId
    })
    console.log(chalk.green('Successfully unreposted playlist'))
  })
