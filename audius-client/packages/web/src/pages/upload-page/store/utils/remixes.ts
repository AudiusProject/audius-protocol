import { ID } from 'common/models/Identifiers'

export const createRemixOfMetadata = ({
  parentTrackId
}: {
  parentTrackId: ID
}) => {
  return {
    tracks: [
      {
        parent_track_id: parentTrackId
      }
    ]
  }
}
