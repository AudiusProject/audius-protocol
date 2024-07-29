import { Button } from '@audius/harmony'

import { formatPrice } from '../util/format'

export const GatedConditionsButton = (props) => {
  const { streamConditions, trackURL } = props

  const price = streamConditions.usdcPurchase.price

  return (
    <Button size='xs' color='lightGreen' asChild>
      <a
        target='_blank'
        rel='noreferrer'
        href={`https://isaac.audius.co/${trackURL}?checkout=true`}
        style={{ textDecoration: 'none' }}
      >
        ${formatPrice(price)}
      </a>
    </Button>
  )
}
