import { Command } from '@commander-js/extra-typings'
import { getCurrentUserId, initializeAudiusSdk } from '../utils'

export const getTrackCommand = new Command('get')
  .description('Get a track by ID')
  .argument('<trackId>', 'The track to fetch')
  .option('--from <from>', 'The account to use')
  .action(async (trackId, { from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })
    const userId = await getCurrentUserId()
    const { data: track } = await audiusSdk.full.tracks.getTrack({
      userId,
      trackId
    })
    console.info(track)
  })
