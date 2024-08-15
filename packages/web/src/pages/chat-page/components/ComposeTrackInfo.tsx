import { useGetTrackById } from '@audius/common/api'
import { SquareSizes, ID } from '@audius/common/models'
import { Flex, Text } from '@audius/harmony'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import UserBadges from 'components/user-badges/UserBadges'
import { useTrackCoverArt2 } from 'hooks/useTrackCoverArt'

type ComposerTrackInfoProps = {
  trackId: ID
}

export const ComposerTrackInfo = (props: ComposerTrackInfoProps) => {
  const { trackId } = props
  const image = useTrackCoverArt2(trackId, SquareSizes.SIZE_150_BY_150)

  const { data: track } = useGetTrackById({ id: trackId })

  if (!track) return null

  const { user } = track

  return (
    <Flex ph='l' pv='s' gap='m' borderBottom='default'>
      <Flex
        borderRadius='s'
        h='unit12'
        w='unit12'
        style={{ overflow: 'hidden' }}
      >
        <DynamicImage style={{ height: '100%', width: '100%' }} image={image} />
      </Flex>
      <Flex direction='column' alignItems='flex-start' justifyContent='center'>
        <Text variant='body' strength='strong'>
          {track.title}
        </Text>
        <Flex alignItems='center' gap='xs'>
          <Text variant='body' strength='strong'>
            {user.name}
          </Text>
          <UserBadges userId={user.user_id} badgeSize={14} />
        </Flex>
      </Flex>
    </Flex>
  )
}
