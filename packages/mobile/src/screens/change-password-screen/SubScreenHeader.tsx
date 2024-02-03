import { Flex, Text } from '@audius/harmony-native'

export const SubScreenHeader = ({
  title,
  description
}: {
  title: string
  description: string
}) => {
  return (
    <Flex gap='s'>
      <Text variant='title'>{title}</Text>
      <Text variant='body'>{description}</Text>
    </Flex>
  )
}
