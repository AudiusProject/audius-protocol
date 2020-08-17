import { ID } from 'models/common/Identifiers'

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
