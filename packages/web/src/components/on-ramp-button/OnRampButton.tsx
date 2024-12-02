import { forwardRef } from 'react'

import { OnRampProvider } from '@audius/common/store'
import {
  Button,
  ButtonProps,
  IconLogoCoinbasePay,
  IconLogoLinkByStripe
} from '@audius/harmony'

const messages = {
  buyWith: 'Buy with',
  buyUsing: 'Buy using'
}

const coinbaseColor = '#0052ff'
const stripeColor = '#00aaf5'

type OnRampButtonProps = ButtonProps & {
  provider: OnRampProvider
  buttonPrefix?: string
  textClassName?: string
}

export const OnRampButton = forwardRef<HTMLButtonElement, OnRampButtonProps>(
  (props, ref) => {
    const { buttonPrefix: buttonPrefixProp, provider, ...otherProps } = props
    const isStripe = provider === OnRampProvider.STRIPE
    const isCoinbase = provider === OnRampProvider.COINBASE
    const buttonPrefix =
      buttonPrefixProp || (isStripe ? messages.buyUsing : messages.buyWith)

    return (
      <Button
        ref={ref}
        aria-label={`${buttonPrefix} ${provider}`}
        hexColor={
          isStripe ? stripeColor : isCoinbase ? coinbaseColor : undefined
        }
        fullWidth
        {...otherProps}
      >
        {buttonPrefix}
        {isStripe ? (
          <IconLogoLinkByStripe
            width={'6em'}
            height={'1.33em'}
            color='staticWhite'
          />
        ) : (
          <IconLogoCoinbasePay
            width={'6em'}
            height={'1.33em'}
            color='staticWhite'
          />
        )}
      </Button>
    )
  }
)
