import { OnRampProvider } from '@audius/common'
import { Button, ButtonProps, ButtonType } from '@audius/stems'
import cn from 'classnames'

import { ReactComponent as StripeLogo } from 'assets/img/LogoStripe.svg'
import { ReactComponent as CoinbaseLogo } from 'assets/img/coinbase-pay/LogoCoinbase.svg'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import styles from './OnRampButton.module.css'

const messages = {
  buyWith: 'Buy with'
}

export const OnRampButton = (
  props: Omit<ButtonProps, 'text'> & { provider: OnRampProvider }
) => {
  const { className, textClassName, provider, ...otherProps } = props
  const darkMode = isDarkMode() || isMatrix()
  const isStripe = provider === OnRampProvider.STRIPE
  const isCoinbase = provider === OnRampProvider.COINBASE

  return (
    <Button
      aria-label={`${messages.buyWith} ${provider}`}
      text={
        <>
          <span>{messages.buyWith}</span>
          {isStripe ? (
            <StripeLogo className={styles.logo} width={67} height={28} />
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
        { [styles.darkMode]: darkMode },
        className
      )}
      textClassName={cn(styles.textClassName, textClassName)}
      {...otherProps}
    />
  )
}
