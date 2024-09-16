import { IconCart, IconSpecialAccess } from '@audius/harmony'
import cn from 'classnames'

import Background from '../../assets/img/dogEar.svg'

import styles from './DogEar.module.css'

export const DogEar = ({ size, variant }) => {
  return (
    <>
      <Background
        className={cn(styles.dogEar, {
          [styles.small]: size === 's',
          [styles.purchase]: variant === 'purchase',
          [styles.special]: variant === 'special'
        })}
      />
      {variant === 'purchase' ? (
        <IconCart
          size={size || 'm'}
          className={cn(styles.icon, {
            [styles.small]: size === 's'
          })}
          color='staticWhite'
        />
      ) : (
        <IconSpecialAccess
          size={size || 'm'}
          className={cn(styles.icon, {
            [styles.small]: size === 's'
          })}
          color='staticWhite'
        />
      )}
    </>
  )
}
