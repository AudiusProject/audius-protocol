import { full } from '@audius/sdk'
import snakecaseKeys from 'snakecase-keys'

import { Remix } from '~/models/Track'
import { decodeHashId } from '~/utils/hashIds'
import { removeNullable } from '~/utils/typeUtils'

import { userMetadataFromSDK } from './user'

export const remixFromSDK = (input: full.FullRemix): Remix | undefined => {
  const remix = snakecaseKeys(input)
  const decodedTrackId = decodeHashId(input.parentTrackId)
  const user = userMetadataFromSDK(remix.user)
  if (!decodedTrackId || !user) {
    return undefined
  }

  return {
    ...remix,
    parent_track_id: decodedTrackId,
    user
  }
}

export const remixListFromSDK = (input?: full.FullRemix[]) =>
  input ? input.map((d) => remixFromSDK(d)).filter(removeNullable) : []
