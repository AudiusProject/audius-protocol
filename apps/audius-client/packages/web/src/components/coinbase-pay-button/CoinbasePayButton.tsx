import cn from 'classnames'
import { useAsync } from 'react-use'

import styles from './CoinbasePayButton.module.css'

export enum CoinbasePayButtonVariant {
  ADD_CRYPTO = 'addCrypto',
  ADD_ETH = 'addEth',
  BUY = 'buy',
  CONTINUE = 'continue',
  GENERIC_CONDENSED = 'generic-condensed',
  GENERIC = 'generic'
}
export enum CoinbasePayButtonSize {
  NORMAL = 'normal',
  COMPACT = 'compact'
}
export enum CoinbasePayButtonImageResolution {
  DEFAULT = '',
  X2 = '@2x',
  X3 = '@3x'
}

export const allowedCoinbasePayTokens = ['SOL']

export const CoinbasePayButton = ({
  className,
  isDisabled,
  onClick,
  variant = CoinbasePayButtonVariant.GENERIC,
  size = CoinbasePayButtonSize.NORMAL,
  resolution = CoinbasePayButtonImageResolution.DEFAULT
}: {
  className?: string
  variant?: CoinbasePayButtonVariant
  size?: CoinbasePayButtonSize
  resolution?: CoinbasePayButtonImageResolution
  isDisabled?: boolean
  onClick: () => void
}) => {
  // Lazy load the image to keep bundle size small
  const imageSrc = useAsync(async () => {
    try {
      const module = await import(
        `assets/img/coinbase-pay/${size}/button-cbPay-${size}-${variant}${resolution}.png`
      )
      const image: string =
        typeof module === 'string' ? module : module?.default
      return image
    } catch (e) {
      console.error(`Error: Couldn't load Coinbase Button Image`, {
        size,
        variant,
        resolution
      })
    }
  }, [size, variant, resolution])

  return imageSrc.loading ? null : (
    <button
      className={cn(className, styles.payButton)}
      onClick={onClick}
      disabled={isDisabled}>
      <img
        className={cn({
          [styles.compact]: size === CoinbasePayButtonSize.COMPACT
        })}
        src={imageSrc.value}
      />
    </button>
  )
}
