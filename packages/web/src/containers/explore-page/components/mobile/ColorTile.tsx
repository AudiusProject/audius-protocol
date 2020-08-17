import React, { ReactNode } from 'react'
import cn from 'classnames'

import styles from './ColorTile.module.css'

type ColorTileProps = {
  title: string
  link: string
  description?: string
  gradient?: string
  shadow?: string
  icon?: ReactNode | JSX.Element | null
  emoji?: string
  className?: string
  goToRoute: (route: string) => void
}

const ColorTile = ({
  title,
  link,
  description,
  gradient,
  shadow,
  icon,
  emoji,
  className,
  goToRoute
}: ColorTileProps) => {
  return (
    <div
      className={cn(styles.colorTile, className, {
        [styles.hasEmoji]: !!emoji
      })}
      onClick={() => goToRoute(link)}
      style={{
        boxShadow: `0 2px 8px -2px ${shadow}`,
        background: gradient
      }}
    >
      <div className={styles.title}>{title}</div>
      <div className={styles.description}>{description}</div>
      {emoji && <i className={`emoji xl ${emoji}`} />}
      {icon && <div className={styles.icon}>{icon}</div>}
    </div>
  )
}

export default ColorTile
