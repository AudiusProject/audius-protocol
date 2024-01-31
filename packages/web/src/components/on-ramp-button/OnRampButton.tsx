import { OnRampProvider } from '@audius/common/store'
import {} from '@audius/common'
import { Button, ButtonProps, ButtonType } from '@audius/stems'
import cn from 'classnames'

import LogoStripeLink from 'assets/img/LogoStripeLink.svg'
import CoinbaseLogo from 'assets/img/coinbase-pay/LogoCoinbase.svg'

import styles from './OnRampButton.module.css'

const messages = {
  buyWith: 'Buy with',
  buyUsing: 'Buy using'
}

export const OnRampButton = (
  props: Omit<ButtonProps, 'text'> & {
    provider: OnRampProvider
    buttonPrefix?: string
  }
) => {
  const {
    buttonPrefix: buttonPrefixProp,
    className,
    textClassName,
    provider,
    ...otherProps
  } = props
  const isStripe = provider === OnRampProvider.STRIPE
  const isCoinbase = provider === OnRampProvider.COINBASE
  const buttonPrefix =
    buttonPrefixProp || (isStripe ? messages.buyUsing : messages.buyWith)

  return (
    <Button
      aria-label={`${buttonPrefix} ${provider}`}
      text={
        <>
          <span>{buttonPrefix}</span>
          {isStripe ? (
            <LogoStripeLink
              className={styles.logo}
              width={'6em'}
              height={'1.33em'}
            />
          ) : (
            <CoinbaseLogo
              className={styles.logo}
              width={'5.75em'}
              height={'0.75em'}
            />
          )}
        </>
      }
      includeHoverAnimations
      type={ButtonType.GLASS}
      className={cn(
        styles.button,
        { [styles.stripeButton]: isStripe },
        { [styles.coinbaseButton]: isCoinbase },
        className
      )}
      textClassName={cn(styles.textClassName, textClassName)}
      {...otherProps}
    />
  )
}
