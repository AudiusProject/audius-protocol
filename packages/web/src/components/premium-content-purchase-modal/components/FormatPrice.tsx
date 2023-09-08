import { formatPrice } from '@audius/common'
import cn from 'classnames'

import styles from './FormatPrice.module.css'

type FormatPriceProps = {
  amountDue: number
  basePrice: number
  className?: string
}

export const FormatPrice = ({
  amountDue,
  basePrice,
  className
}: FormatPriceProps) => {
  if (basePrice === amountDue)
    return (
      <span className={cn(styles.container, className)}>{`$${formatPrice(
        amountDue
      )}`}</span>
    )
  return (
    <span className={cn(styles.container, className)}>
      <del>{`$${formatPrice(basePrice)}`}</del>
      <ins className={styles.existingBalance}>{`$${
        amountDue === 0 ? '0' : formatPrice(amountDue)
      }`}</ins>
    </span>
  )
}
