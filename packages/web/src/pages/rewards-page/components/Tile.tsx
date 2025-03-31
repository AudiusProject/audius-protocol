import { ReactNode } from 'react'

import cn from 'classnames'

import styles from './Tile.module.css'

export const LEARN_MORE_URL = 'http://blog.audius.co/posts/community-meet-audio'

type TileProps = {
  className?: string
  children: ReactNode
}

export const Tile = ({ className, children }: TileProps) => {
  return (
    <div className={cn([styles.tileContainer, className])}> {children}</div>
  )
}
