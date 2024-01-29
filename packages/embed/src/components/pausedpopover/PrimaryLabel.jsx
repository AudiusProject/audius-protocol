import { Text } from '@audius/harmony'

const messages = {
  more: 'Looking for more like this?',
  buy: 'Buy The Full Track On Audius'
}

const PrimaryLabel = ({ streamConditions }) => {
  const isPurchaseable =
    streamConditions && 'usdc_purchase' in streamConditions

  return (
    <Text color='default' variant='heading' size='s'>
      {isPurchaseable ? messages.buy : messages.more}
    </Text>
  )
}

export default PrimaryLabel
