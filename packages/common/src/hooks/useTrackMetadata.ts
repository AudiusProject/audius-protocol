import { useGetTrackById } from '~/api/track'
import { ID } from '~/models'
import { FeatureFlags } from '~/services/remote-config/feature-flags'

import { getCanonicalName } from '../utils/genres'
import { formatDate, formatSecondsAsText } from '../utils/timeUtil'

import { useFeatureFlag } from './useFeatureFlag'

export enum TrackMetadataType {
  DURATION = 'duration',
  GENRE = 'genre',
  MOOD = 'mood',
  KEY = 'key',
  BPM = 'bpm',
  RELEASE_DATE = 'releaseDate',
  UPDATED_AT = 'updatedAt',
  ALBUM = 'album'
}

type TrackMetadataProps = {
  trackId: ID
}

type TrackMetadataInfo = {
  id: TrackMetadataType
  label: string
  value: string
}

export const useTrackMetadata = ({
  trackId
}: TrackMetadataProps): TrackMetadataInfo[] => {
  const { data: track } = useGetTrackById({ id: trackId })
  const { isEnabled: isSearchV2Enabled } = useFeatureFlag(
    FeatureFlags.SEARCH_V2
  )
  if (!track) return []

  const {
    duration,
    genre,
    release_date: releaseDate,
    is_scheduled_release: isScheduledRelease,
    mood,
    is_unlisted: isUnlisted,
    musical_key,
    bpm
  } = track

  const labels = [
    {
      id: TrackMetadataType.DURATION,
      label: 'Duration',
      value: formatSecondsAsText(duration)
    },
    {
      id: TrackMetadataType.GENRE,
      label: 'Genre',
      value: getCanonicalName(genre)
    },
    {
      id: TrackMetadataType.RELEASE_DATE,
      value: formatDate(releaseDate ?? ''),
      label: 'Released',
      isHidden: isUnlisted || !releaseDate || isScheduledRelease
    },
    {
      id: TrackMetadataType.MOOD,
      label: 'Mood',
      value: mood
    },
    {
      id: TrackMetadataType.BPM,
      label: 'BPM',
      value: Math.round(bpm ?? 0).toString(),
      isHidden: !isSearchV2Enabled
    },
    {
      id: TrackMetadataType.KEY,
      label: 'Key',
      // TODO: KJ - Might need a map for this to map to key options
      value: musical_key ?? '',
      isHidden: !isSearchV2Enabled
    }
  ].filter(({ isHidden, value }) => !isHidden && !!value)

  return labels
}
