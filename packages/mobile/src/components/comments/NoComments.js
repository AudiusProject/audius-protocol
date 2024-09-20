import { commentsMessages as messages } from '@audius/common/messages';
import { Flex, Text } from '@audius/harmony-native';
export var NoComments = function () { return (<Flex alignItems='center' justifyContent='center' direction='column' style={{ paddingTop: 80, paddingBottom: 80 }}>
    <Text>{messages.noComments}</Text>
    <Text color='subdued'>{messages.noCommentsDescription}</Text>
  </Flex>); };
