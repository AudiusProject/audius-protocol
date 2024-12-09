import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'
import { getCurrentUserId, initializeAudiusSdk, parseBoolean } from '../utils'

export const editPlaylistCommand = new Command('edit')
  .description('Update an existing playlist')
  .argument('<playlistId>', 'id of playlist to update')
  .option('-n, --playlist-name <playlistName>', 'Name of playlist')
  .option('-d, --description <description>', 'Description of playlist')
  .option('-f, --from <from>', 'The account to edit the track from')
  .option(
    '-p, --is-private [isPrivate]',
    'Change visibility of the collection',
    parseBoolean
  )
  .action(
    async (playlistId, { from, playlistName, isPrivate, description }) => {
      const audiusSdk = await initializeAudiusSdk({ handle: from })
      const userId = await getCurrentUserId()

      const response = await audiusSdk.playlists.updatePlaylist({
        userId,
        playlistId,
        metadata: {
          ...(playlistName ? { playlistName } : {}),
          ...(isPrivate ? { isPrivate } : {}),
          ...(description ? { description } : {})
        }
      })

      console.log(chalk.green('Successfully updated playlist!'))
    }
  )
