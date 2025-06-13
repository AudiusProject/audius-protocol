import { Flex, Text } from '@audius/harmony'

type TextRowProps = {
  left: string
  right?: string | null
}

export const TextRow = ({ left, right }: TextRowProps) => {
  return (
    <Flex justifyContent='space-between'>
      <Text variant='title' size='l' strength='default'>
        {left}
      </Text>
      {right ? (
        <Text variant='title' size='l' strength='default'>
          {right}
        </Text>
      ) : null}
    </Flex>
  )
}
