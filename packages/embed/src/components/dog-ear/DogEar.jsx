import { IconCart, IconSpecialAccess, IconReceive } from '@audius/harmony'
import cn from 'classnames'

import Background from '../../assets/img/dogEar.svg'

import styles from './DogEar.module.css'

const VARIANT_TO_ICON = {
  purchase: IconCart,
  special: IconSpecialAccess,
  extras: IconReceive
}

export const DogEar = ({ size, variant }) => {
  const Icon = VARIANT_TO_ICON[variant]
  return (
    <>
      <Background
        className={cn(styles.dogEar, {
          [styles.small]: size === 's',
          [styles.purchase]: variant === 'purchase',
          [styles.special]: variant === 'special',
          [styles.extras]: variant === 'extras'
        })}
      />
      <Icon
        size={size || 'm'}
        className={cn(styles.icon, {
          [styles.small]: size === 's'
        })}
        color='staticWhite'
      />
    </>
  )
}
