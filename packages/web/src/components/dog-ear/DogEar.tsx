import { DogEarType } from '@audius/common/models'
import {
  IconVisibilityHidden,
  IconStar,
  IconSpecialAccess,
  IconCart,
  IconCollectible,
  IconLock
} from '@audius/harmony'
import cn from 'classnames'

import Rectangle from 'assets/img/dogEarRectangle.svg'
import { useIsMobile } from 'hooks/useIsMobile'
import { isMatrix } from 'utils/theme/theme'

import styles from './DogEar.module.css'

export type DogEarProps = {
  type: DogEarType
  className?: string
}

const getIcon = (type: DogEarType) => {
  switch (type) {
    case DogEarType.STAR:
      return IconStar
    case DogEarType.HIDDEN:
      return IconVisibilityHidden
    case DogEarType.LOCKED:
      return IconLock
    case DogEarType.COLLECTIBLE_GATED:
      return IconCollectible
    case DogEarType.USDC_PURCHASE:
      return IconCart
    case DogEarType.SPECIAL_ACCESS:
    default:
      return IconSpecialAccess
  }
}

export const DogEar = (props: DogEarProps) => {
  const { type, className } = props
  const isMatrixMode = isMatrix()
  const isMobile = useIsMobile()
  const Icon = getIcon(type)

  return (
    <div
      className={cn(styles.container, className, {
        [styles.isMobile]: isMobile,
        [styles.matrix]: isMatrixMode
      })}
    >
      <Rectangle
        className={cn(styles.rectangle, {
          [styles.gated]: [
            DogEarType.COLLECTIBLE_GATED,
            DogEarType.SPECIAL_ACCESS,
            DogEarType.LOCKED
          ].includes(type),
          [styles.purchase]: type === DogEarType.USDC_PURCHASE,
          [styles.artistPick]: type === DogEarType.STAR,
          [styles.hidden]: type === DogEarType.HIDDEN
        })}
      />
      <Icon className={styles.icon} />
    </div>
  )
}
