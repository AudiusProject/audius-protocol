import { Flex, Text } from '@audius/harmony'

const messages = {
  edit: 'Edit Track'
}
export const EditTrackForm = () => {
  return (
    <Flex>
      <Text variant='display'>{messages.edit}</Text>
    </Flex>
  )
}
