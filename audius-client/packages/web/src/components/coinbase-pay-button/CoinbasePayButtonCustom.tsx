import { Button, ButtonProps, ButtonType } from '@audius/stems'

import { ReactComponent as CoinbaseLogo } from 'assets/img/coinbase-pay/LogoCoinbase.svg'

import styles from './CoinbasePayButtonCustom.module.css'

const messages = {
  buyWith: 'Buy with',
  buyWithCoinbase: 'Buy with Coinbase'
}

export const CoinbasePayButtonCustom = (props: Partial<ButtonProps>) => {
  return (
    <Button
      aria-label={messages.buyWithCoinbase}
      text={
        <>
          <span>{messages.buyWith}</span>
          <CoinbaseLogo
            className={styles.coinbaseLogo}
            width={97}
            height={18}
          />
        </>
      }
      type={ButtonType.GLASS}
      includeHoverAnimations
      className={styles.coinbaseButton}
      textClassName={styles.textClassName}
      {...props}
    />
  )
}
