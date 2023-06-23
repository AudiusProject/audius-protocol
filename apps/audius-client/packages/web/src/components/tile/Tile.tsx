import { ReactNode, ComponentType, ComponentProps, ElementType } from 'react'

import cn from 'classnames'

import styles from './Tile.module.css'

type TileOwnProps<TileComponentType extends ElementType = 'div'> = {
  children: ReactNode
  size?: 'small' | 'medium' | 'large'
  as?: TileComponentType
}

export type TileProps<TileComponentType extends ElementType> =
  TileOwnProps<TileComponentType> &
    Omit<ComponentProps<TileComponentType>, keyof TileOwnProps>

export const Tile = <
  T extends ElementType = ComponentType<ComponentProps<'div'>>
>(
  props: TileProps<T>
) => {
  const {
    children,
    size,
    as: RootComponent = 'div',
    className,
    ...other
  } = props

  return (
    <RootComponent
      className={cn(styles.root, size && styles[size], className)}
      {...other}
    >
      {children}
    </RootComponent>
  )
}
