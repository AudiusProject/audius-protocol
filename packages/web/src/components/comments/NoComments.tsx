import { Flex, Text } from '@audius/harmony'

const messages = {
  title: 'Nothing here yet',
  subtitle: 'Be the first to comment on this track' // TODO: make this derive from entity type
}

export const NoComments = () => (
  <Flex
    alignItems='center'
    justifyContent='center'
    direction='column'
    css={{ paddingTop: 80, paddingBottom: 80 }}
  >
    <Text>{messages.title}</Text>
    <Text color='subdued'>{messages.subtitle}</Text>
  </Flex>
)
