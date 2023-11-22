import { IconCart } from '@audius/harmony'
import cn from 'classnames'

import Rectangle from '../../assets/img/dogEarRectangle.svg'

import styles from './DogEar.module.css'

export const DogEar = ({ size }) => {
  return (
    <>
      <Rectangle
        className={cn(styles.dogEar, {
          [styles.small]: size === 'small'
        })}
      />
      <IconCart
        size={size === 'small' ? 's' : 'm'}
        className={cn(styles.icon, {
          [styles.small]: size === 'small'
        })}
        color='staticWhite'
      />
    </>
  )
}
