import { decodeHashId, getContext } from '@audius/common'
import { call } from 'typed-redux-saga'

export function* getUnclaimedPlaylistId() {
  const { getAudiusLibsTyped } = yield* getContext('audiusBackendInstance')
  const audiusLibs = yield* call(getAudiusLibsTyped)
  if (!audiusLibs.discoveryProvider) return

  const unclaimedId = yield* call(
    [audiusLibs.discoveryProvider, audiusLibs.discoveryProvider.getUnclaimedId],
    'playlists'
  )
  if (!unclaimedId) return
  return decodeHashId(unclaimedId)
}
