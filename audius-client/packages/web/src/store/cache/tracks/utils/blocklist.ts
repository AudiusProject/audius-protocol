import { TrackMetadata } from 'models/Track'
import { waitForWeb3 } from 'services/AudiusBackend'

declare global {
  interface Window {
    Web3: any
    bItems: Set<string>
  }
}

const IS_WEB_HOSTNAME =
  window.location.hostname === process.env.REACT_APP_PUBLIC_HOSTNAME

let blockList: Set<string>

const waitForBItems = async () => {
  // Wait for bItems to load just in case they haven't been fetched yet since
  // they are fetched async.
  if (!window.bItems) {
    let cb
    await new Promise(resolve => {
      cb = resolve
      window.addEventListener('B_ITEMS_LOADED', cb)
    })
    if (cb) window.removeEventListener('B_ITEMS_LOADED', cb)
  }
}

const setBlocked = async <T extends TrackMetadata>(track: T) => {
  // Initialize the set if not present
  if (!blockList) {
    await waitForBItems()
    blockList = window.bItems
  }
  if (IS_WEB_HOSTNAME) {
    await waitForWeb3()
    const shaId = window.Web3.utils.sha3(track.track_id.toString())
    if (blockList.has(shaId)) {
      return {
        ...track,
        is_delete: true,
        _blocked: true
      }
    }
  }
  // Most of the time this method is a no-op
  return track
}

export const setTracksIsBlocked = async <T extends TrackMetadata>(
  tracks: T[]
): Promise<T[]> => {
  return await Promise.all(tracks.map(setBlocked))
}
