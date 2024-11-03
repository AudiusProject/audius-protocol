import { useGetPlaylistById } from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
import type { Collection } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { getDogEarType } from '@audius/common/utils'
import { useSelector } from 'react-redux'

import type { DogEarProps } from './DogEar'
import { DogEar } from './DogEar'

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
