import { Text } from '../Text/Text'
import { Flex } from '../layout/Flex/Flex'

type NotificationCountProps = {
  count: number
}

export const NotificationCount = ({ count }: NotificationCountProps) => (
  <Flex
    row
    alignItems='center'
    borderRadius='xl'
    backgroundColor='primary'
    ph='s'
    pv='xs'
  >
    <Text variant='label' size='xs' color='white'>
      {count}
    </Text>
  </Flex>
)
