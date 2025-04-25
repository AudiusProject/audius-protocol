import { ID } from '@audius/common/src/models'
import { getCollectionTracks } from '@audius/common/src/store/cache/collections/selectors'
import IconKebabHorizontal from '@audius/harmony/src/assets/icons/KebabHorizontal.svg'
import { Artwork } from '@audius/harmony/src/components/artwork/Artwork'
import { IconButton } from '@audius/harmony/src/components/button/IconButton/IconButton'
import { Flex } from '@audius/harmony/src/components/layout/Flex'
import { TextLink } from '@audius/harmony/src/components/text-link'

import { useSelector } from 'utils/reducer'

type ServerTrackListProps = {
  collectionId: ID
}

export const ServerTrackList = (props: ServerTrackListProps) => {
  const { collectionId } = props
  const tracks = useSelector((state) =>
    getCollectionTracks(state, { id: collectionId })
  )
  if (!tracks) return null

  return (
    <ul>
      {tracks.map((track) => {
        const { track_id, title, cover_art } = track
        return (
          <Flex
            as='li'
            key={track_id}
            ph='m'
            pv='s'
            justifyContent='space-between'
          >
            <Flex alignItems='center' gap='m'>
              <Artwork src={cover_art!} h={56} w={56} isLoading={false} />
              <TextLink size='s'>{title}</TextLink>
            </Flex>
            <IconButton
              icon={IconKebabHorizontal}
              aria-label='more options'
              color='subdued'
            />
          </Flex>
        )
      })}
    </ul>
  )
}
