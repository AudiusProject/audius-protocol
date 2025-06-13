import { useCollection, useGetCurrentUserId } from '@audius/common/api'
import { Flex, IconKebabHorizontal } from '@audius/harmony'
import { pick } from 'lodash'

import { CollectionMenuProps } from 'components/menu/CollectionMenu'
import Menu from 'components/menu/Menu'

type OverflowMenuButtonProps = {
  collectionId: number
}

export const CollectionsTableOverflowMenuButton = (
  props: OverflowMenuButtonProps
) => {
  const { collectionId } = props
  const { data: currentUserId } = useGetCurrentUserId()
  const { data: partialCollection } = useCollection(collectionId, {
    select: (collection) =>
      pick(
        collection,
        'is_album',
        'playlist_owner_id',
        'is_private',
        'is_stream_gated',
        'permalink'
      )
  })
  const {
    is_album: isAlbum,
    playlist_owner_id: playlistOwnerId,
    is_private: isPrivate,
    is_stream_gated: isStreamGated,
    permalink
  } = partialCollection ?? {}

  const overflowMenu = {
    type: isAlbum ? 'album' : 'playlist',
    playlistId: collectionId,
    includeEmbed: !isPrivate && !isStreamGated,
    includeVisitArtistPage: false,
    includeShare: true,
    includeEdit: true,
    includeFavorite: false,
    isPublic: !isPrivate,
    isOwner: currentUserId === playlistOwnerId,
    permalink
  } as unknown as CollectionMenuProps

  return (
    <Flex
      alignItems='center'
      css={{ cursor: 'pointer', 'user-select': 'none' }}
    >
      <Menu menu={overflowMenu}>
        {(ref, triggerPopup) => (
          <Flex
            onClick={(e) => {
              e.stopPropagation()
              triggerPopup()
            }}
          >
            <Flex ref={ref}>
              <IconKebabHorizontal color='subdued' size='m' />
            </Flex>
          </Flex>
        )}
      </Menu>
    </Flex>
  )
}
