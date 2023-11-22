import { IconCart } from '@audius/harmony'
import cn from 'classnames'

import Background from '../../assets/img/dogEar.svg'

import styles from './DogEar.module.css'

export const DogEar = ({ size }) => {
  return (
    <>
      <Background
        className={cn(styles.dogEar, {
          [styles.small]: size === 's'
        })}
      />
      <IconCart
        size={size || 'm'}
        className={cn(styles.icon, {
          [styles.small]: size === 's'
        })}
        color='staticWhite'
      />
    </>
  )
}
