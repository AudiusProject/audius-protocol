import { useChatBlastAudienceContent } from '@audius/common/hooks'
import { SquareSizes } from '@audius/common/models'
import { decodeHashId } from '@audius/common/utils'
import type { ChatBlast } from '@audius/sdk'
import { css } from '@emotion/native'

import { Flex, Text } from '@audius/harmony-native'
import { CollectionImageV2 } from 'app/components/image/CollectionImageV2'
import { TrackImageV2 } from 'app/components/image/TrackImageV2'
import { zIndex } from 'app/utils/zIndex'

export const ChatBlastSubHeader = ({ chat }: { chat: ChatBlast }) => {
  const {
    audience_content_id: audienceContentId,
    audience_content_type: audienceContentType
  } = chat
  const { chatBlastAudienceDescription, contentTitle } =
    useChatBlastAudienceContent({ chat })
  const decodedId = decodeHashId(audienceContentId) ?? undefined
  return (
    <Flex
      row
      backgroundColor='white'
      justifyContent='center'
      pb='s'
      style={css({ zIndex: zIndex.CHAT_BLAST_SUBHEADER })}
    >
      {decodedId ? (
        <Flex row gap='xs'>
          {audienceContentType === 'track' ? (
            <TrackImageV2
              trackId={decodedId}
              size={SquareSizes.SIZE_150_BY_150}
            />
          ) : (
            <CollectionImageV2
              collectionId={decodedId}
              size={SquareSizes.SIZE_150_BY_150}
            />
          )}
          <Text variant='body' size='s' strength='strong'>
            {contentTitle}
          </Text>
        </Flex>
      ) : (
        <Text variant='body' size='s' color='subdued'>
          {chatBlastAudienceDescription}
        </Text>
      )}
    </Flex>
  )
}
