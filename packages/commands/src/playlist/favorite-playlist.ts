import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'
import { getCurrentUserId, initializeAudiusSdk } from '../utils'

export const favoritePlaylistCommand = new Command('favorite')
  .description('Favorite playlist')
  .argument('<playlistId>', 'Id of playlist to favorite')
  .option('-f, --from <from>', 'The account to favorite playlist from')
  .action(async (playlistId, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })
    const userId = await getCurrentUserId()

    await audiusSdk.playlists.favoritePlaylist({
      userId,
      playlistId
    })
    console.log(chalk.green('Successfully favorited playlist'))
  })
