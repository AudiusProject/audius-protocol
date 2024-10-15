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
      css={{ paddingTop: 80, paddingBottom: 80 }}
    >
      <Text>{messages.noComments}</Text>
      <Text color='subdued'>
        {isEntityOwner
          ? messages.noCommentsOwner
          : messages.noCommentsDescription}
      </Text>
    </Flex>
  )
}
