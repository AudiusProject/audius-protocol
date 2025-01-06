import { useGetCurrentUserId } from '@audius/common/api'
import { Collection } from '@audius/common/models'
import { collectionPageSelectors, CommonState } from '@audius/common/store'
import { Flex, IconKebabHorizontal } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { CollectionMenuProps } from 'components/menu/CollectionMenu'
import Menu from 'components/menu/Menu'

const { getCollection } = collectionPageSelectors

type OverflowMenuButtonProps = {
  collectionId: number
}

export const CollectionsTableOverflowMenuButton = (
  props: OverflowMenuButtonProps
) => {
  const { collectionId } = props
  const { data: currentUserId } = useGetCurrentUserId({})
  const {
    is_album: isAlbum,
    playlist_owner_id: playlistOwnerId,
    is_private: isPrivate,
    is_stream_gated: isStreamGated,
    permalink
  } = (useSelector((state: CommonState) =>
    getCollection(state, { id: collectionId })
  ) as Collection) ?? {}

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
