import { OnRampProvider } from '@audius/common'
import { Button, ButtonProps, ButtonType } from '@audius/stems'
import cn from 'classnames'

import { ReactComponent as LogoStripeLink } from 'assets/img/LogoStripeLink.svg'
import { ReactComponent as CoinbaseLogo } from 'assets/img/coinbase-pay/LogoCoinbase.svg'

import styles from './OnRampButton.module.css'

const messages = {
  buyWith: 'Buy with',
  buyUsing: 'Buy using'
}

export const OnRampButton = (
  props: Omit<ButtonProps, 'text'> & { provider: OnRampProvider }
) => {
  const { className, textClassName, provider, ...otherProps } = props
  const isStripe = provider === OnRampProvider.STRIPE
  const isCoinbase = provider === OnRampProvider.COINBASE
  const buttonPrefix = isStripe ? messages.buyUsing : messages.buyWith

  return (
    <Button
      aria-label={`${buttonPrefix} ${provider}`}
      text={
        <>
          <span>{buttonPrefix}</span>
          {isStripe ? (
            <LogoStripeLink className={styles.logo} width={145} height={32} />
          ) : (
            <CoinbaseLogo className={styles.logo} width={97} height={18} />
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
