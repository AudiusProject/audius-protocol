import { USDC } from '@audius/fixed-decimal'
import { Button, Text } from '@audius/harmony'

import { getCopyableLink } from '../../util/shareUtil'

const messages = {
  listen: 'Listen on Audius',
  buy: 'Buy'
}

const ListenOnAudiusCTA = ({ audiusURL, streamConditions }) => {
  const onClick = () => {
    window.open(getCopyableLink(audiusURL), '_blank')
  }
  const isPurchaseable =
    streamConditions && 'usdc_purchase' in streamConditions

  return (
    <Button
      color={isPurchaseable ? 'lightGreen' : undefined}
      fullWidth
      onClick={onClick}
    >
      <Text variant='title' size='l'>
        {isPurchaseable
          ? `${messages.buy} $${USDC(
            streamConditions.usdc_purchase.price / 100
          ).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`
          : messages.listen}
      </Text>
    </Button>
  )
}

export default ListenOnAudiusCTA
