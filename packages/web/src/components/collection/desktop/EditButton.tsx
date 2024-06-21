import { useCallback } from 'react'

import { useEditPlaylistModal } from '@audius/common/store'
import { IconPencil, IconButton, IconButtonProps } from '@audius/harmony'
import { useFlag } from 'hooks/useRemoteConfig'
import { FeatureFlags } from '@audius/common/services'
import { useGetPlaylistById } from '@audius/common/api'
import { useDispatch } from 'react-redux'
import { push as pushRoute } from 'connected-react-router'

type EditButtonProps = Partial<IconButtonProps> & {
  collectionId: number
}

export const EditButton = (props: EditButtonProps) => {
  const { collectionId, ...other } = props
  const { isEnabled: isEditTrackRedesignEnabled } = useFlag(
    FeatureFlags.EDIT_TRACK_REDESIGN
  )
  const dispatch = useDispatch()
  const goToRoute = (route: string) => dispatch(pushRoute(route))
  const { onOpen } = useEditPlaylistModal()

  const { data: collection } = useGetPlaylistById({ playlistId: collectionId })

  const handleEdit = useCallback(() => {
    isEditTrackRedesignEnabled
      ? collection?.permalink && goToRoute(`${collection.permalink}/edit`)
      : onOpen({ collectionId, isCollectionViewed: true })
  }, [collectionId, onOpen])

  return (
    <IconButton
      icon={IconPencil}
      onClick={handleEdit}
      aria-label='Edit Collection'
      color='subdued'
      {...other}
    />
  )
}
