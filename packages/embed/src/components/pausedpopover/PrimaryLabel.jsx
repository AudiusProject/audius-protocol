import { Text } from '@audius/harmony'

const messages = {
  more: 'Looking for more like this?',
  buy: 'Buy The Full Track On Audius'
}

const PrimaryLabel = ({ premiumConditions }) => {
  const isPurchaseable =
    premiumConditions && 'usdc_purchase' in premiumConditions

  return (
    <Text color='default' variant='heading' size='s'>
      {isPurchaseable ? messages.buy : messages.more}
    </Text>
  )
}

export default PrimaryLabel
