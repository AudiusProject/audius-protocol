import { useCurrentCommentSection } from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import { Flex, Text } from '@audius/harmony'

export const NoComments = () => {
  const { isEntityOwner } = useCurrentCommentSection()
  return (
    <Flex
      alignItems='center'
      justifyContent='center'
      direction='column'
      css={{ paddingBlock: 80, paddingInline: 24 }}
    >
      <Text>{messages.noComments}</Text>
      <Text color='subdued'>
        {isEntityOwner
          ? messages.noCommentsPreviewOwner
          : messages.noCommentsDescription}
      </Text>
    </Flex>
  )
}
