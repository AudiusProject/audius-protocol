import { Text } from '@audius/harmony'

const messages = {
  of: 'of'
}

type OutOfTextProps = {
  numerator: number
  denominator: number
}

export const OutOfText = (props: OutOfTextProps) => {
  const { numerator, denominator } = props
  return (
    <Text size='s' variant='label' color='subdued'>
      {numerator} {messages.of} {denominator}
    </Text>
  )
}
