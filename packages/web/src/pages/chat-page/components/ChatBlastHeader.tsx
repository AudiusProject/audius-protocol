import { useChatBlastAudienceContent } from '@audius/common/hooks'
import { SquareSizes } from '@audius/common/models'
import { Flex, IconTowerBroadcast, IconUserList, Text } from '@audius/harmony'
import { ChatBlast } from '@audius/sdk'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useCollectionCoverArt2 } from 'hooks/useCollectionCoverArt'
import { useTrackCoverArt2 } from 'hooks/useTrackCoverArt'
import { decodeHashId } from 'utils/hashIds'

import styles from './ChatHeader.module.css'

export const ChatBlastHeader = ({ chat }: { chat: ChatBlast }) => {
  const {
    audience_content_id: audienceContentId,
    audience_content_type: audienceContentType
  } = chat
  const { chatBlastSecondaryTitle, chatBlastCTA, contentTitle, audienceCount } =
    useChatBlastAudienceContent({
      chat
    })
  const decodedId = audienceContentId
    ? decodeHashId(audienceContentId) ?? undefined
    : undefined
  const albumArtwork = useCollectionCoverArt2(
    decodedId,
    SquareSizes.SIZE_150_BY_150
  )
  const trackArtwork = useTrackCoverArt2(decodedId, SquareSizes.SIZE_150_BY_150)

  return (
    <Flex justifyContent='space-between' w='100%'>
      <Flex gap='s' alignItems='center'>
        {audienceContentId ? (
          <DynamicImage
            image={
              audienceContentType === 'track' ? trackArtwork : albumArtwork
            }
            wrapperClassName={styles.artworkContainer}
          />
        ) : null}
        <Flex column gap='xs' alignItems='flex-start'>
          <Flex gap='s' alignItems='center'>
            <IconTowerBroadcast size='m' color='default' />
            <Text variant='title' size='l' ellipses>
              {chatBlastSecondaryTitle}
            </Text>
            <Text variant='title' size='l' color='subdued' ellipses>
              {contentTitle}
            </Text>
          </Flex>
          <Text variant='body' size='s'>
            {chatBlastCTA}
          </Text>
        </Flex>
      </Flex>
      <Flex alignItems='flex-end'>
        <Flex gap='s' alignItems='center'>
          <IconUserList size='m' color='default' />
          <Text variant='title' size='xl'>
            {audienceCount}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
