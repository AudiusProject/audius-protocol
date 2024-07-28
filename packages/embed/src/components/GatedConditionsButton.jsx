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
        href={`http://localhost:3002/${trackURL}?checkout=true`}
        style={{ textDecoration: 'none' }}
      >
        ${formatPrice(price)}
      </a>
    </Button>
  )
}
