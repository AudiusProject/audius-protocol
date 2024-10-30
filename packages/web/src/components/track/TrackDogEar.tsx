import { useGetTrackById } from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
import { Track } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { getDogEarType, Nullable } from '@audius/common/utils'
import { useSelector } from 'react-redux'

import { DogEar, DogEarProps } from 'components/dog-ear'

const { getUserId } = accountSelectors

type TrackDogEarProps = {
  trackId: number
} & Partial<DogEarProps>

export const TrackDogEar = (props: TrackDogEarProps) => {
  const { trackId, ...other } = props
  const { data: track } = useGetTrackById({ id: trackId })
  const currentUserId = useSelector(getUserId)

  const { hasStreamAccess } = useGatedContentAccess(track as Nullable<Track>)

  if (!track) return null
  const {
    owner_id,
    stream_conditions,
    is_download_gated,
    download_conditions
  } = track

  const isOwner = owner_id === currentUserId

  const dogEarType = getDogEarType({
    hasStreamAccess,
    isOwner,
    streamConditions: stream_conditions,
    isDownloadGated: is_download_gated,
    downloadConditions: download_conditions
  })

  if (!dogEarType) return null

  return <DogEar type={dogEarType} {...other} />
}
