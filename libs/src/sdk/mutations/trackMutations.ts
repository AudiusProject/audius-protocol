import { gql } from '@apollo/client'
import { AudiusLibs } from '../../AudiusLibs'

export const SAVE_TRACK = gql`
  mutation SaveTrack($id: ID!, $optimisticResponse: Track!) {
    saveTrack(
      id: $id
      input: { id: $id, optimisticResponse: $optimisticResponse }
    ) @rest(type: "Track", path: "/track/save", method: "POST") {
      id
      __typename
      has_current_user_saved
    }
  }
`

export const makeSaveTrackMutation = (libs: AudiusLibs) => async (options) => {
  const id = AudiusLibs.Utils.decodeHashId(options.body.id)
  if (id) {
    try {
      return await libs.EntityManager.saveTrack(id)
    } catch (err) {
      throw err
    }
  }
}
