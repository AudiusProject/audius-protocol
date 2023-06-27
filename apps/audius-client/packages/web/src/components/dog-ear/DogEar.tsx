import { IconCollectible, IconLock, IconSpecialAccess } from '@audius/stems'
import cn from 'classnames'

import { ReactComponent as IconHidden } from 'assets/img/iconHidden.svg'
import { ReactComponent as IconStar } from 'assets/img/iconStar.svg'
import { isMobile } from 'utils/clientUtil'
import { isMatrix } from 'utils/theme/theme'

import styles from './DogEar.module.css'

export enum DogEarType {
  STAR = 'star',
  HIDDEN = 'hidden',
  LOCKED = 'locked',
  COLLECTIBLE_GATED = 'collectible gated',
  SPECIAL_ACCESS = 'special access'
}

export type DogEarProps = {
  type: DogEarType
  className?: string
  containerClassName?: string
}

export const DogEar = (props: DogEarProps) => {
  const { type, className, containerClassName } = props
  const isMatrixMode = isMatrix()
  const isMobileMode = isMobile()
  const renderIcon = () => {
    switch (type) {
      case DogEarType.STAR:
        return <IconStar />
      case DogEarType.HIDDEN:
        return <IconHidden />
      case DogEarType.LOCKED:
        return <IconLock />
      case DogEarType.COLLECTIBLE_GATED:
        return <IconCollectible />
      case DogEarType.SPECIAL_ACCESS:
        return <IconSpecialAccess />
    }
  }

  return (
    <div
      className={cn(styles.artistPick, className, {
        [styles.isMobile]: isMobileMode,
        [styles.matrix]: isMatrixMode
      })}
    >
      <div
        className={cn(styles.container, containerClassName, {
          [styles.gated]: [
            DogEarType.COLLECTIBLE_GATED,
            DogEarType.SPECIAL_ACCESS,
            DogEarType.LOCKED
          ].includes(type),
          [styles.star]: type === DogEarType.STAR,
          [styles.hidden]: type === DogEarType.HIDDEN
        })}
      />
      {renderIcon()}
    </div>
  )
}
