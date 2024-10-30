import { useGetPlaylistById } from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
import { Collection } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { getDogEarType, Nullable } from '@audius/common/utils'
import { useSelector } from 'react-redux'

import { DogEar, DogEarProps } from 'components/dog-ear'

const { getUserId } = accountSelectors

type CollectionDogEarProps = {
  collectionId: number
} & Partial<DogEarProps>

export const CollectionDogEar = (props: CollectionDogEarProps) => {
  const { collectionId, ...other } = props
  const { data: collection } = useGetPlaylistById({ playlistId: collectionId })
  const currentUserId = useSelector(getUserId)

  const { hasStreamAccess } = useGatedContentAccess(
    collection as Nullable<Collection>
  )

  if (!collection) return null
  const { playlist_owner_id, stream_conditions } = collection

  const isOwner = playlist_owner_id === currentUserId

  const dogEarType = getDogEarType({
    hasStreamAccess,
    isOwner,
    streamConditions: stream_conditions
  })

  if (!dogEarType) return null

  return <DogEar type={dogEarType} {...other} />
}
