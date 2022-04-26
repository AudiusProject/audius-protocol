import { RepostDoc, SaveDoc } from './types/docs'
import { PlaylistIndexer } from './indexers/PlaylistIndexer'
import { RepostIndexer } from './indexers/RepostIndexer'
import { SaveIndexer } from './indexers/SaveIndexer'
import { TrackIndexer } from './indexers/TrackIndexer'
import { UserIndexer } from './indexers/UserIndexer'
import { PendingUpdates, startListener, takePending } from './listener'
import { logger } from './logger'
import { setupTriggers } from './setup'
import { getBlocknumberCheckpoints } from './conn'

export const indexer = {
  playlists: new PlaylistIndexer(),
  reposts: new RepostIndexer(),
  saves: new SaveIndexer(),
  tracks: new TrackIndexer(),
  users: new UserIndexer(),
}

async function processPending(pending: PendingUpdates) {
  return Promise.all([
    indexer.playlists.indexIds(Array.from(pending.playlistIds)),
    indexer.tracks.indexIds(Array.from(pending.trackIds)),
    indexer.users.indexIds(Array.from(pending.userIds)),

    indexer.reposts.indexRows(pending.reposts as RepostDoc[]),
    indexer.saves.indexRows(pending.saves as SaveDoc[]),
  ])
}

async function main() {
  const indexers = Object.values(indexer)

  await setupTriggers()
  await Promise.all(indexers.map((ix) => ix.createIndex({ drop: false })))

  await startListener()
  const checkpoints = await getBlocknumberCheckpoints()

  logger.info(checkpoints, 'catchup from blocknumbers')
  await Promise.all(Object.values(indexer).map((i) => i.catchup(checkpoints)))

  logger.info('catchup done... cutting over aliases')
  await Promise.all(indexers.map((ix) => ix.cutoverAlias()))

  logger.info('processing events')
  while (true) {
    const pending = takePending()
    if (pending) {
      await processPending(pending)
    }
    await new Promise((r) => setTimeout(r, 500))
  }
}

main()
