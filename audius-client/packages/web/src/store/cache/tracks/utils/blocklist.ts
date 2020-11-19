import { getRemoteVar, StringKeys } from 'services/remote-config'
import { TrackMetadata } from 'models/Track'
import { waitForRemoteConfig } from 'services/remote-config/Provider'
import { waitForWeb3 } from 'services/AudiusBackend'

declare global {
  interface Window {
    Web3: any
  }
}

const IS_WEB_HOSTNAME =
  window.location.hostname === process.env.REACT_APP_PUBLIC_HOSTNAME

let blockList: Set<string>

const setBlocked = async <T extends TrackMetadata>(track: T) => {
  // Initialize the set if not present
  if (!blockList) {
    await waitForRemoteConfig()
    blockList = new Set(
      (getRemoteVar(StringKeys.CONTENT_BLOCK_LIST) || '').split(',')
    )
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
