import { Flex, Text } from '@audius/harmony'

type EmptyTabProps = {
  isOwner: boolean
  name: string
  text: string
}

export const EmptyTab = (props: EmptyTabProps) => {
  const text = props.isOwner
    ? `You haven't ${props.text} yet...`
    : `${props.name} hasn’t ${props.text} yet...`
  return (
    <Flex p='l' flex={1} w='100%' justifyContent='center'>
      <Text>
        {text} <i className='emoji thinking-face' />
      </Text>
    </Flex>
  )
}
