import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'
import { getCurrentUserId, initializeAudiusSdk } from '../utils'

export const unrepostTrackCommand = new Command('unrepost')
  .description('Unrepost track')
  .argument('<trackId>', 'Id of the track to unrepost')
  .option('-f, --from <from>', 'The account to unrepost track from')
  .action(async (trackId, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })
    const userId = await getCurrentUserId()

    await audiusSdk.tracks.unrepostTrack({
      userId,
      trackId
    })

    console.log(chalk.green('Successfully unreposted track'))
  })
